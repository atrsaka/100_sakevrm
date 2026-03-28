import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const packageJson = JSON.parse(
  await fs.readFile(path.join(repoRoot, "package.json"), "utf8")
);

const args = parseArgs(process.argv.slice(2));
const version = args.version || packageJson.version;
const source = args.source || "public/favicon.svg";
const output = args.output || `docs/public/releases/release-header-v${version}.svg`;
const eyebrow = args.eyebrow || "RELEASE NOTES";
const title = args.title || `GeminiVRM v${version}`;
const subtitle =
  args.subtitle || "Generated from public/favicon.svg for the published release notes";
const callout = args.callout || "Browser-first VRM chat powered by Gemini Live";
const highlights = (args.highlights || [
  "Gemini Live native audio",
  "Bundled VRM avatar + idle motions",
  "Optional YouTube relay",
]).slice(0, 3);

const sourcePath = path.resolve(repoRoot, source);
const outputPath = path.resolve(repoRoot, output);

const faviconSvg = await fs.readFile(sourcePath, "utf8");
ensureSvgSource(faviconSvg, source);
const faviconMarkup = buildInlineSvgMarkup(faviconSvg);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
const svg = buildReleaseHeaderSvg({
  eyebrow,
  title,
  subtitle,
  callout,
  highlights,
  faviconMarkup,
  source,
});

await fs.writeFile(outputPath, svg, "utf8");
console.log(`Generated ${path.relative(repoRoot, outputPath)} from ${source}`);

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

    if (key === "highlights") {
      parsed[key] = next
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean);
    } else {
      parsed[key] = next;
    }

    index += 1;
  }

  return parsed;
}

function ensureSvgSource(svg, sourcePathLabel) {
  if (!svg.includes("<svg")) {
    throw new Error(`Source asset is not an SVG: ${sourcePathLabel}`);
  }
}

function buildInlineSvgMarkup(svgSource) {
  const sanitizedSvg = svgSource
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
  const openTagMatch = sanitizedSvg.match(/^<svg\b([^>]*)>/i);
  const closeTagIndex = sanitizedSvg.toLowerCase().lastIndexOf("</svg>");

  if (!openTagMatch || closeTagIndex === -1) {
    throw new Error("Could not parse SVG root for inline embedding.");
  }

  const rootAttributes = openTagMatch[1] || "";
  const innerMarkup = sanitizedSvg
    .slice(openTagMatch[0].length, closeTagIndex)
    .trim();

  const viewBoxMatch = rootAttributes.match(
    /\bviewBox\s*=\s*(['"])([^'"]+)\1/i
  );
  const widthMatch = rootAttributes.match(
    /\bwidth\s*=\s*(['"])([^'"]+)\1/i
  );
  const heightMatch = rootAttributes.match(
    /\bheight\s*=\s*(['"])([^'"]+)\1/i
  );

  const width = parseSvgLength(widthMatch?.[2]);
  const height = parseSvgLength(heightMatch?.[2]);
  const fallbackViewBox =
    width !== null && height !== null ? `0 0 ${width} ${height}` : null;
  const viewBox = viewBoxMatch?.[2] || fallbackViewBox;

  if (!viewBox) {
    throw new Error("SVG source requires either a viewBox or width/height.");
  }

  return {
    markup: innerMarkup,
    viewBox,
  };
}

function parseSvgLength(value) {
  if (!value) {
    return null;
  }

  const match = value.trim().match(/^([0-9]+(?:\.[0-9]+)?)/);
  return match ? Number.parseFloat(match[1]) : null;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return escapeXml(value).replaceAll('"', "&quot;");
}

function estimateTextWidth(text, fontSize, widthRatio = 0.56) {
  return text.length * fontSize * widthRatio;
}

function fitFontSize(
  text,
  maxWidth,
  baseFontSize,
  minFontSize,
  widthRatio = 0.56
) {
  const estimatedWidth = estimateTextWidth(text, baseFontSize, widthRatio);
  if (estimatedWidth <= maxWidth) {
    return baseFontSize;
  }

  const scaledFontSize = Math.floor((maxWidth / estimatedWidth) * baseFontSize);
  return Math.max(minFontSize, scaledFontSize);
}

function truncateTextToWidth(text, maxWidth, fontSize, widthRatio = 0.56) {
  if (estimateTextWidth(text, fontSize, widthRatio) <= maxWidth) {
    return text;
  }

  let truncated = text.trim();
  while (
    truncated.length > 1 &&
    estimateTextWidth(`${truncated}...`, fontSize, widthRatio) > maxWidth
  ) {
    truncated = truncated.slice(0, -1).trimEnd();
  }

  return `${truncated}...`;
}

function wrapText(
  text,
  maxWidth,
  fontSize,
  widthRatio = 0.56,
  maxLines = 2
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [""];
  }

  const lines = [];
  let currentLine = words[0];

  for (let index = 1; index < words.length; index += 1) {
    const word = words[index];
    const candidate = `${currentLine} ${word}`;
    if (estimateTextWidth(candidate, fontSize, widthRatio) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;

    if (lines.length === maxLines - 1) {
      currentLine = truncateTextToWidth(
        [currentLine, ...words.slice(index + 1)].join(" "),
        maxWidth,
        fontSize,
        widthRatio
      );
      break;
    }
  }

  lines.push(currentLine);
  return lines.slice(0, maxLines);
}

function buildTspanMarkup(lines, x, lineHeight) {
  return lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : lineHeight;
      return `        <tspan x="${x}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join("\n");
}

function buildReleaseHeaderSvg({
  eyebrow: eyebrowText,
  title: titleText,
  subtitle: subtitleText,
  callout: calloutText,
  highlights: highlightItems,
  faviconMarkup,
  source: sourcePathLabel,
}) {
  const highlightLines = highlightItems
    .map((item, index) => {
      const y = 84 + index * 32;
      return [
        `      <circle cx="18" cy="${y - 7}" r="6" fill="#00B894" />`,
        `      <text x="38" y="${y}" fill="#c7d4e5" font-family="M PLUS 2, Arial, sans-serif" font-size="22">`,
        `        ${escapeXml(item)}`,
        "      </text>",
      ].join("\n");
    })
    .join("\n");
  const titleFontSize = fitFontSize(titleText, 560, 68, 44, 0.58);
  const titleLines = wrapText(titleText, 560, titleFontSize, 0.58, 2);
  const titleLineHeight = Math.round(titleFontSize * 1.04);
  const titleMarkup = buildTspanMarkup(titleLines, 0, titleLineHeight);
  const subtitleLines = wrapText(subtitleText, 540, 22, 0.53, 2);
  const subtitleLineHeight = 26;
  const subtitleMarkup = buildTspanMarkup(subtitleLines, 0, subtitleLineHeight);
  const subtitleStartY = 150 + (titleLines.length - 1) * titleLineHeight;
  const subtitleLastBaseline =
    subtitleStartY + (subtitleLines.length - 1) * subtitleLineHeight;
  const calloutLines = wrapText(calloutText, 400, 18, 0.54, 2);
  const calloutLineHeight = 20;
  const calloutHeight = 78 + (calloutLines.length - 1) * calloutLineHeight;
  const calloutMarkup = buildTspanMarkup(calloutLines, 28, calloutLineHeight);
  const calloutY = subtitleLastBaseline + 24;
  const highlightsY = calloutY + calloutHeight + 20;

  return `<!-- Generated by scripts/generate-release-header.mjs from ${escapeAttribute(
    sourcePathLabel
  )} -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(titleText)}</title>
  <desc id="desc">A release banner for ${escapeXml(
    titleText
  )} generated from the repository favicon.</desc>
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f9f5eb" />
      <stop offset="55%" stop-color="#f5ead6" />
      <stop offset="100%" stop-color="#e7f5ef" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2F7CF6" />
      <stop offset="100%" stop-color="#00B894" />
    </linearGradient>
    <linearGradient id="panel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f2f7ff" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="28" flood-color="#2A2E431A" />
    </filter>
  </defs>

  <rect width="1280" height="720" fill="url(#bg)" />
  <circle cx="156" cy="108" r="84" fill="#ffffff8f" />
  <circle cx="1138" cy="592" r="130" fill="#ffffff66" />
  <path d="M0 620C184 542 350 520 520 580C696 642 904 650 1280 500V720H0Z" fill="#ffffff5c" />

  <g filter="url(#shadow)">
    <rect x="104" y="84" width="1072" height="560" rx="42" fill="url(#panel)" />
    <rect x="104" y="84" width="1072" height="82" rx="42" fill="#f4efe5" />
    <circle cx="166" cy="124" r="10" fill="#ff8b74" />
    <circle cx="198" cy="124" r="10" fill="#ffcb57" />
    <circle cx="230" cy="124" r="10" fill="#5ed08f" />
  </g>

  <g transform="translate(146 186)">
    <rect width="412" height="356" rx="34" fill="#f8fbff" stroke="#dce7f7" stroke-width="4" />
    <circle cx="206" cy="178" r="138" fill="url(#accent)" fill-opacity="0.12" />
    <rect x="36" y="34" width="184" height="30" rx="15" fill="#e9f1fc" />
    <rect x="36" y="78" width="120" height="20" rx="10" fill="#e9f1fc" />
    <clipPath id="iconClip">
      <rect x="52" y="100" width="308" height="308" rx="24" />
    </clipPath>
    <g clip-path="url(#iconClip)">
      <svg
        x="52"
        y="100"
        width="308"
        height="308"
        viewBox="${escapeAttribute(faviconMarkup.viewBox)}"
        preserveAspectRatio="xMidYMid meet"
      >
${faviconMarkup.markup}
      </svg>
    </g>
  </g>

  <g transform="translate(620 178)">
    <rect x="0" y="0" width="194" height="42" rx="21" fill="#ffffff" stroke="#dbe8f7" stroke-width="2.5" />
    <text x="24" y="28" fill="#ff5d72" font-family="Montserrat, Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3">
      ${escapeXml(eyebrowText)}
    </text>

    <text x="0" y="112" fill="#1f2b3d" font-family="Montserrat, Arial, sans-serif" font-size="${titleFontSize}" font-weight="700">
${titleMarkup}
    </text>
    <text x="0" y="${subtitleStartY}" fill="#475569" font-family="M PLUS 2, Arial, sans-serif" font-size="22">
${subtitleMarkup}
    </text>

    <g transform="translate(0 ${calloutY})">
      <rect width="456" height="${calloutHeight}" rx="24" fill="#ffffff" stroke="#dbe8f7" stroke-width="3" />
      <path d="M28 28h118" stroke="#2F7CF6" stroke-width="12" stroke-linecap="round" />
      <path d="M172 28h34" stroke="#00B894" stroke-width="12" stroke-linecap="round" />
      <path d="M236 28h88" stroke="#dbe8f7" stroke-width="12" stroke-linecap="round" />
      <circle cx="348" cy="28" r="12" fill="#00B894" />
      <text x="28" y="58" fill="#1f2b3d" font-family="Montserrat, Arial, sans-serif" font-size="18" font-weight="700">
${calloutMarkup}
      </text>
    </g>

    <g transform="translate(0 ${highlightsY})">
      <rect width="534" height="172" rx="30" fill="#1f2b3d" />
      <text x="38" y="50" fill="#eef4ff" font-family="Montserrat, Arial, sans-serif" font-size="24" font-weight="700">
        Highlights
      </text>
${highlightLines}
    </g>
  </g>
</svg>
`;
}
