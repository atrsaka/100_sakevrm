import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const args = parseArgs(process.argv.slice(2));

const inputs = (args.input
  ? [args.input]
  : [
      ".tmp-benchmark-podcast-topics-natural/report/podcast-benchmark-overview.en.svg",
      ".tmp-benchmark-podcast-topics-natural/report/podcast-benchmark-overview.ja.svg",
    ]
).map((filePath) => path.resolve(repoRoot, filePath));

const tolerance = Number.parseFloat(args.tolerance || "1.5");
const browser = await chromium.launch({ headless: true });

try {
  let failed = false;

  for (const inputPath of inputs) {
    await fs.access(inputPath);
    const page = await browser.newPage({ viewport: { width: 2000, height: 1400 } });

    try {
      await page.goto(pathToFileURL(inputPath).href);

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
          };
        }

        const allText = Array.from(document.querySelectorAll("text"));
        const missingBoundary = allText
          .filter((element) => !element.hasAttribute("data-fit-boundary"))
          .map((element) => element.id || element.textContent?.trim() || "<anonymous>");

        const checked = allText
          .filter((element) => element.hasAttribute("data-fit-boundary"))
          .map((element) => {
            const boundaryId = element.getAttribute("data-fit-boundary");
            const boundary = document.getElementById(boundaryId);
            if (!boundary) {
              return {
                target: element.id || element.textContent?.trim() || "<anonymous>",
                ok: false,
                boundaryId,
                reason: "missing-boundary",
              };
            }

            const targetBox = getTransformedBox(element);
            const boundaryBox = getTransformedBox(boundary);
            const overflow = {
              left: Math.max(0, boundaryBox.left - targetBox.left),
              right: Math.max(0, targetBox.right - boundaryBox.right),
              top: Math.max(0, boundaryBox.top - targetBox.top),
              bottom: Math.max(0, targetBox.bottom - boundaryBox.bottom),
            };

            return {
              target: element.id || element.textContent?.trim() || "<anonymous>",
              boundaryId,
              targetBox,
              overflow,
              ok: Object.values(overflow).every((value) => value <= toleranceValue),
            };
          });

        const overlapFailures = [];
        const byBoundary = new Map();
        for (const item of checked) {
          if (!item.targetBox) {
            continue;
          }
          if (!byBoundary.has(item.boundaryId)) {
            byBoundary.set(item.boundaryId, []);
          }
          byBoundary.get(item.boundaryId).push(item);
        }

        for (const [, items] of byBoundary) {
          for (let index = 0; index < items.length; index += 1) {
            for (let otherIndex = index + 1; otherIndex < items.length; otherIndex += 1) {
              const a = items[index];
              const b = items[otherIndex];
              const overlapX =
                Math.min(a.targetBox.right, b.targetBox.right) -
                Math.max(a.targetBox.left, b.targetBox.left);
              const overlapY =
                Math.min(a.targetBox.bottom, b.targetBox.bottom) -
                Math.max(a.targetBox.top, b.targetBox.top);
              if (overlapX > toleranceValue && overlapY > toleranceValue) {
                overlapFailures.push({
                  targetA: a.target,
                  targetB: b.target,
                  boundaryId: a.boundaryId,
                  overlap: { x: overlapX, y: overlapY },
                });
              }
            }
          }
        }

        return {
          missingBoundary,
          failed: checked.filter((item) => !item.ok),
          overlapFailures,
          passedCount: checked.filter((item) => item.ok).length,
          checkedCount: checked.length,
        };
      }, { toleranceValue: tolerance });

      if (
        report.missingBoundary.length > 0 ||
        report.failed.length > 0 ||
        report.overlapFailures.length > 0
      ) {
        failed = true;
        console.error(`Layout overflow detected in ${path.relative(repoRoot, inputPath)}`);
        if (report.missingBoundary.length > 0) {
          console.error(`Missing data-fit-boundary on: ${report.missingBoundary.join(", ")}`);
        }
        for (const item of report.failed) {
          console.error(
            `${item.target} outside ${item.boundaryId} overflow=${JSON.stringify(item.overflow)}`
          );
        }
        for (const item of report.overlapFailures) {
          console.error(
            `${item.targetA} overlaps ${item.targetB} in ${item.boundaryId} overlap=${JSON.stringify(item.overlap)}`
          );
        }
      } else {
        console.log(
          `${path.relative(repoRoot, inputPath)} layout OK: ${report.checkedCount} text nodes fit their boundaries.`
        );
      }
    } finally {
      await page.close();
    }
  }

  if (failed) {
    process.exitCode = 1;
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
