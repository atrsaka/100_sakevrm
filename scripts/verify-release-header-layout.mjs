import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const args = parseArgs(process.argv.slice(2));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const packageJson = JSON.parse(
  await fs.readFile(path.join(repoRoot, "package.json"), "utf8")
);

const input =
  args.input ||
  `docs/public/releases/release-header-v${packageJson.version}.svg`;
const inputPath = path.resolve(repoRoot, input);
const inputUrl = pathToFileURL(inputPath).href;
const tolerance = Number.parseFloat(args.tolerance || "1.5");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

try {
  await page.goto(inputUrl);

  const report = await page.evaluate(({ toleranceValue }) => {
    function getTransformedBox(element) {
      const bbox = element.getBBox();
      const ctm = element.getCTM();
      const points = [
        new DOMPoint(bbox.x, bbox.y).matrixTransform(ctm),
        new DOMPoint(bbox.x + bbox.width, bbox.y).matrixTransform(ctm),
        new DOMPoint(bbox.x, bbox.y + bbox.height).matrixTransform(ctm),
        new DOMPoint(bbox.x + bbox.width, bbox.y + bbox.height).matrixTransform(ctm),
      ];
      const xs = points.map((point) => point.x);
      const ys = points.map((point) => point.y);
      return {
        left: Math.min(...xs),
        right: Math.max(...xs),
        top: Math.min(...ys),
        bottom: Math.max(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      };
    }

    const targets = Array.from(
      document.querySelectorAll("[data-fit-boundary]")
    ).map((element) => {
      const boundaryId = element.getAttribute("data-fit-boundary");
      const padding = Number.parseFloat(
        element.getAttribute("data-fit-padding") || "0"
      );
      const boundary = document.getElementById(boundaryId);

      if (!boundary) {
        return {
          target: element.id || element.textContent.trim().slice(0, 48),
          boundaryId,
          ok: false,
          reason: "missing-boundary",
        };
      }

      const targetBox = getTransformedBox(element);
      const boundaryBox = getTransformedBox(boundary);
      const overflow = {
        left: Math.max(0, boundaryBox.left + padding - targetBox.left),
        right: Math.max(0, targetBox.right - (boundaryBox.right - padding)),
        top: Math.max(0, boundaryBox.top + padding - targetBox.top),
        bottom: Math.max(0, targetBox.bottom - (boundaryBox.bottom - padding)),
      };
      const ok = Object.values(overflow).every(
        (value) => value <= toleranceValue
      );

      return {
        target: element.id || element.textContent.replace(/\s+/g, " ").trim(),
        boundaryId,
        padding,
        ok,
        targetBox,
        boundaryBox,
        overflow,
      };
    });

    return {
      checked: targets.length,
      failed: targets.filter((target) => !target.ok),
      passed: targets.filter((target) => target.ok).map((target) => target.target),
    };
  }, { toleranceValue: tolerance });

  if (report.failed.length > 0) {
    console.error(`Layout overflow detected in ${input}`);
    for (const failure of report.failed) {
      console.error(
        [
          `target=${failure.target}`,
          `boundary=${failure.boundaryId}`,
          `overflow=${JSON.stringify(failure.overflow)}`,
        ].join(" ")
      );
    }
    process.exitCode = 1;
  } else {
    console.log(
      `Release header layout looks valid: ${report.checked} text nodes inside their boundaries.`
    );
  }
} finally {
  await browser.close();
}

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}
