import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const args = parseArgs(process.argv.slice(2));
const outputDir = path.resolve(
  repoRoot,
  args.outputDir || ".tmp-benchmark-podcast-topics-natural/report"
);
const stableSnapshotPath = path.join(
  repoRoot,
  "docs",
  "public",
  "benchmarks",
  "podcast-benchmark-overview.json"
);
const stableAssetDir = path.join(repoRoot, "docs", "public", "benchmarks");
const historyJsonPath = path.join(
  stableAssetDir,
  "podcast-benchmark-history.json"
);
const historyCsvPath = path.join(
  stableAssetDir,
  "podcast-benchmark-history.csv"
);
const canvas = { width: 1800, height: 1280 };

const METRICS = [
  "relayTurnFirstAudioDelayMs",
  "relayTurnHandoffSilenceMs",
  "relayTurnResponseResolvedMs",
  "relayTurnPlaybackFinishedMs",
];

const AGI_RUN_MEANS = {
  streaming: {
    relayTurnFirstAudioDelayMs: [333.9, 2.0, 2.2],
    relayTurnHandoffSilenceMs: [2296.8, 838.2, 1219.9],
    relayTurnResponseResolvedMs: [11928.3, 10771.5, 10170.3],
    relayTurnPlaybackFinishedMs: [15344.5, 13996.5, 15744.0],
  },
  batch: {
    relayTurnFirstAudioDelayMs: [9955.4, 9572.4, 9619.0],
    relayTurnHandoffSilenceMs: [11186.3, 10531.7, 10293.9],
    relayTurnResponseResolvedMs: [17987.7, 19161.3, 20312.0],
    relayTurnPlaybackFinishedMs: [20524.3, 20649.7, 21695.5],
  },
};

const topics = [
  {
    key: "meal",
    en: "Today's Meal",
    ja: "きょうのご飯",
    noteEn: "Batch stayed audio-native across all 15 relay turns.",
    noteJa: "Batch 側も 15 ターンすべて音声入力のままでした。",
  },
  {
    key: "agi",
    en: "AGI",
    ja: "AGI",
    noteEn: "Batch fell back to transcript on all 15 relay turns.",
    noteJa: "Batch 側は 15 ターンすべて transcript fallback でした。",
  },
  {
    key: "aiMind",
    en: "AI Consciousness",
    ja: "AIの心",
    noteEn: "Batch fell back to transcript on all 15 relay turns.",
    noteJa: "Batch 側は 15 ターンすべて transcript fallback でした。",
  },
];

const localeCopy = {
  en: {
    fileSuffix: "en",
    title: "Podcast Relay Benchmark",
    subtitle: "Natural Japanese prompts | 6 turns per conversation | 3 runs per mode",
    body: "Mean is the average of 3 repeated run means. Variance is sample variance across those run means.",
    cardBody: "3 runs per mode | sample variance across run means",
    firstCardTitle: "First audio mean",
    handoffCardTitle: "Handoff mean",
    firstSectionTitle: "First audio delay",
    firstSectionSubtitle: "Mean seconds per relay turn",
    handoffSectionTitle: "Handoff silence",
    handoffSectionSubtitle:
      "Mean seconds from prior speech end to the next first audio",
    streaming: "Streaming",
    batch: "Batch",
    summaryTitle: "Topic notes",
    labelFirst: "First audio",
    labelHandoff: "Handoff",
    labelResponse: "Response",
    labelPlayback: "Playback",
    labelVariance: "Variance",
    methodologyTitle: "Methodology and caveats",
    methodologyBullets: [
      "Mean: average of 3 run means with equal weight. Each run has 5 relay turns.",
      "Variance: sample variance across the 3 run means.",
      "AGI note: the first successful run comes from preserved console means.",
      "Error bars: plus/minus 1 standard deviation across repeated runs.",
    ],
    pathSummaryLines: [
      "Streaming proof: prepared input 15/15 and prepared output 15/15 on every topic.",
      "Batch note: Meal stayed audio-native. AGI and AI Consciousness used transcript fallback.",
      "Both localized charts use the same benchmark data and the same layout checks.",
    ],
    faster: "faster",
    lower: "lower",
  },
  ja: {
    fileSuffix: "ja",
    title: "ポッドキャスト中継ベンチマーク",
    subtitle: "自然な日本語プロンプト | 会話ごとに6ターン | モードごと3回",
    body: "平均は 3 回の run mean の平均です。分散はその 3 回に対する sample variance を使っています。",
    cardBody: "各モード 3 runs | run mean に対する sample variance",
    firstCardTitle: "初回音声の平均",
    handoffCardTitle: "切り替え無音の平均",
    firstSectionTitle: "最初の音声が出るまで",
    firstSectionSubtitle: "リレーターンごとの平均秒数",
    handoffSectionTitle: "話者切り替えの無音",
    handoffSectionSubtitle: "前の発話終了から次の最初の音声までの平均秒数",
    streaming: "ストリーミング",
    batch: "バッチ",
    summaryTitle: "トピック別メモ",
    labelFirst: "最初の音声",
    labelHandoff: "切替の無音",
    labelResponse: "応答完了",
    labelPlayback: "再生完了",
    labelVariance: "分散",
    methodologyTitle: "集計方法と注意点",
    methodologyBullets: [
      "平均: 3 回の run mean を等重みで平均しています。各 run は 5 relay turns です。",
      "分散: 3 回の run mean に対する sample variance です。",
      "AGI: 最初の成功 run は保存していた console mean を使っています。",
      "誤差線: repeated runs に対する ±1 SD です。",
    ],
    pathSummaryLines: [
      "Streaming 側は全トピックで prepared input 15/15、prepared output 15/15 です。",
      "Batch 側は きょうのご飯 だけ音声入力のまま、AGI と AIの心 は transcript fallback です。",
      "英語版と日本語版は同じ benchmark data と同じ layout checks から生成しています。",
    ],
    faster: "短縮",
    lower: "改善",
  },
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const { report, sourceKind } = await buildReportData();
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(stableAssetDir, { recursive: true });

  const jsonPath = path.join(outputDir, "podcast-benchmark-overview.json");
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");
  await fs.writeFile(stableSnapshotPath, JSON.stringify(report, null, 2), "utf8");
  await writeHistoryArtifacts({ report, sourceKind });

  const browser = await chromium.launch({ headless: true });

  try {
    const outputs = [];
    for (const [locale, copy] of Object.entries(localeCopy)) {
      const svg = buildReportSvg({ locale, copy, report, canvas });
      const svgPath = path.join(
        outputDir,
        `podcast-benchmark-overview.${copy.fileSuffix}.svg`
      );
      const pngPath = path.join(
        outputDir,
        `podcast-benchmark-overview.${copy.fileSuffix}.png`
      );

      await fs.writeFile(svgPath, svg, "utf8");
      await renderSvgToPng({ browser, svg, pngPath, canvas });
      await fs.copyFile(
        svgPath,
        path.join(stableAssetDir, `podcast-benchmark-${copy.fileSuffix}.svg`)
      );
      await fs.copyFile(
        pngPath,
        path.join(stableAssetDir, `podcast-benchmark-${copy.fileSuffix}.png`)
      );
      outputs.push({ locale, svgPath, pngPath });
    }

    await fs.copyFile(
      path.join(outputDir, "podcast-benchmark-overview.en.svg"),
      path.join(outputDir, "podcast-benchmark-overview.svg")
    );
    await fs.copyFile(
      path.join(outputDir, "podcast-benchmark-overview.en.png"),
      path.join(outputDir, "podcast-benchmark-overview.png")
    );

    console.log(JSON.stringify({ jsonPath, outputs, overallCards: report.overallCards }, null, 2));
  } finally {
    await browser.close();
  }
}

async function buildReportData() {
  try {
    return {
      report: await buildFreshReportData(),
      sourceKind: "fresh-artifacts",
    };
  } catch (error) {
    if (!(error && error.code === "ENOENT")) {
      throw error;
    }

    try {
      return {
        report: await readJson(stableSnapshotPath),
        sourceKind: "stable-snapshot",
      };
    } catch (snapshotError) {
      if (snapshotError && snapshotError.code === "ENOENT") {
        throw new Error(
          `Podcast benchmark source artifacts were not found and no stable snapshot exists at ${stableSnapshotPath}.`
        );
      }
      throw snapshotError;
    }
  }
}

async function buildFreshReportData() {
  const mealSummary = await readJson(
    path.join(
      repoRoot,
      ".tmp-benchmark-podcast-topics-natural",
      "meal",
      "benchmark-summary.json"
    )
  );

  const mealRuns = deriveRunMeansFromRawRuns(mealSummary.rawRuns);
  const aiMindRuns = await deriveAiMindRunMeans();

  const statsByTopic = {
    meal: buildTopicStats(mealRuns),
    agi: buildTopicStats(AGI_RUN_MEANS),
    aiMind: buildTopicStats(aiMindRuns),
  };

  return {
    generatedAt: new Date().toISOString(),
    methodology: {
      mean: "Average of 3 repeated run means with equal weight. Each run has 5 relay turns.",
      variance: "Sample variance across the 3 run means for each topic and mode.",
      note: "AGI includes one preserved successful run mean from console logs because its first artifact folder was overwritten before the benchmark output fix.",
    },
    statsByTopic,
    overallCards: buildOverallCards(statsByTopic),
  };
}

async function deriveAiMindRunMeans() {
  const root = "C:/Users/Aslan/AppData/Local/Temp/gemini-vrm-benchmark-topics-natural";
  const result = emptyModeBuckets();
  const fileMap = {
    streaming: [
      path.join(root, "ai-mind-stream-01", "benchmark-summary.json"),
      path.join(root, "ai-mind-stream-02", "benchmark-summary.json"),
      path.join(root, "ai-mind-stream-03", "benchmark-summary.json"),
    ],
    batch: [
      path.join(root, "ai-mind-batch-01", "benchmark-summary.json"),
      path.join(root, "ai-mind-batch-02", "benchmark-summary.json"),
      path.join(root, "ai-mind-batch-03", "benchmark-summary.json"),
    ],
  };

  for (const mode of ["streaming", "batch"]) {
    for (const filePath of fileMap[mode]) {
      const summary = await readJson(filePath);
      for (const metric of METRICS) {
        result[mode][metric].push(summary.summaryByMode[mode].metrics[metric].mean);
      }
    }
  }

  return result;
}

function emptyModeBuckets() {
  const result = { streaming: {}, batch: {} };
  for (const mode of ["streaming", "batch"]) {
    for (const metric of METRICS) {
      result[mode][metric] = [];
    }
  }
  return result;
}

function deriveRunMeansFromRawRuns(rawRuns) {
  const result = emptyModeBuckets();
  for (const rawRun of rawRuns) {
    for (const metric of METRICS) {
      result[rawRun.mode][metric].push(mean(rawRun.metrics[metric]));
    }
  }
  return result;
}

function buildTopicStats(runMeansByMode) {
  const stats = {};
  for (const mode of ["streaming", "batch"]) {
    stats[mode] = {};
    for (const metric of METRICS) {
      const runs = runMeansByMode[mode][metric];
      const metricMean = mean(runs);
      const variance = sampleVariance(runs);
      const stdDev = Math.sqrt(variance);
      stats[mode][metric] = {
        runs: runs.map((value) => round(value, 1)),
        meanMs: round(metricMean, 1),
        varianceMs2: round(variance, 1),
        stdDevMs: round(stdDev, 1),
        meanSec: round(metricMean / 1000, 2),
        varianceSec2: round(variance / 1000000, 2),
        stdDevSec: round(stdDev / 1000, 2),
      };
    }
  }
  return stats;
}

function buildOverallCards(statsByTopic) {
  const firstStreaming = mean(
    topics.map((topic) => statsByTopic[topic.key].streaming.relayTurnFirstAudioDelayMs.meanMs)
  );
  const firstBatch = mean(
    topics.map((topic) => statsByTopic[topic.key].batch.relayTurnFirstAudioDelayMs.meanMs)
  );
  const handoffStreaming = mean(
    topics.map((topic) => statsByTopic[topic.key].streaming.relayTurnHandoffSilenceMs.meanMs)
  );
  const handoffBatch = mean(
    topics.map((topic) => statsByTopic[topic.key].batch.relayTurnHandoffSilenceMs.meanMs)
  );

  return {
    firstAudio: buildGainCard(firstStreaming, firstBatch),
    handoff: buildGainCard(handoffStreaming, handoffBatch),
  };
}

function buildGainCard(streamingMeanMs, batchMeanMs) {
  const gainMs = batchMeanMs - streamingMeanMs;
  return {
    streamingSec: round(streamingMeanMs / 1000, 2),
    batchSec: round(batchMeanMs / 1000, 2),
    gainSec: round(gainMs / 1000, 2),
    gainPct: round((gainMs / batchMeanMs) * 100, 1),
  };
}

function buildReportSvg({ locale, copy, report, canvas: svgCanvas }) {
  const theme = {
    bg: "#f5f1e8",
    shell: "#fffdf9",
    shellStroke: "#e4ddd0",
    headerStart: "#153541",
    headerEnd: "#164c48",
    textPrimary: "#10212b",
    textMuted: "#556674",
    textSoft: "#dbe7ee",
    card: "#ffffff",
    cardTint: "#f8fafc",
    grid: "#d9e3e8",
    streaming: "#157a6e",
    streamingDark: "#0f4f4a",
    batch: "#de6d46",
    batchDark: "#8a4024",
    chipA: "#45d0c6",
    chipB: "#f59f4a",
    noteBg: "#f6f4ef",
    noteStroke: "#ddd6c7",
  };

  const shell = { x: 56, y: 36, width: 1688, height: 1208, rx: 40 };
  const header = { x: 92, y: 74, width: 1616, height: 220, rx: 34 };
  const chartCard = { x: 92, y: 330, width: 980, height: 676, rx: 30 };
  const summaryColumn = { x: 1104, y: 330, width: 604, height: 676 };
  const footer = { x: 92, y: 1038, width: 1616, height: 168, rx: 28 };

  const parts = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgCanvas.width}" height="${svgCanvas.height}" viewBox="0 0 ${svgCanvas.width} ${svgCanvas.height}" role="img" aria-labelledby="title desc">`,
    `<title id="title">${escapeXml(copy.title)}</title>`,
    `<desc id="desc">${escapeXml(
      locale === "en"
        ? "Bilingual benchmark report comparing streaming and batch podcast relay latency across three Japanese conversation topics."
        : "3つの日本語トピックに対してストリーミングとバッチのポッドキャスト中継レイテンシを比較したベンチマークレポート。"
    )}</desc>`,
    `<defs>`,
    `  <linearGradient id="bgGradient" x1="0" y1="0" x2="1" y2="1">`,
    `    <stop offset="0%" stop-color="${theme.bg}" />`,
    `    <stop offset="70%" stop-color="#eef7f5" />`,
    `    <stop offset="100%" stop-color="#fff8ee" />`,
    `  </linearGradient>`,
    `  <linearGradient id="headerGradient" x1="0" y1="0" x2="1" y2="1">`,
    `    <stop offset="0%" stop-color="${theme.headerStart}" />`,
    `    <stop offset="100%" stop-color="${theme.headerEnd}" />`,
    `  </linearGradient>`,
    `  <filter id="panelShadow" x="-20%" y="-20%" width="140%" height="160%">`,
    `    <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#14212b18" />`,
    `  </filter>`,
    `</defs>`,
    `<rect width="${svgCanvas.width}" height="${svgCanvas.height}" fill="url(#bgGradient)" />`,
    `<circle cx="1600" cy="120" r="180" fill="#ffffff" opacity="0.6" />`,
    `<circle cx="108" cy="1160" r="150" fill="#dff3ef" opacity="0.72" />`,
    `<g filter="url(#panelShadow)">`,
    `  <rect x="${shell.x}" y="${shell.y}" width="${shell.width}" height="${shell.height}" rx="${shell.rx}" fill="${theme.shell}" stroke="${theme.shellStroke}" stroke-width="1.5" />`,
    `  <rect x="${header.x}" y="${header.y}" width="${header.width}" height="${header.height}" rx="${header.rx}" fill="url(#headerGradient)" />`,
    `  <rect x="${chartCard.x}" y="${chartCard.y}" width="${chartCard.width}" height="${chartCard.height}" rx="${chartCard.rx}" fill="${theme.card}" stroke="#dde5ea" stroke-width="1.2" />`,
    `  <rect x="${footer.x}" y="${footer.y}" width="${footer.width}" height="${footer.height}" rx="${footer.rx}" fill="${theme.noteBg}" stroke="${theme.noteStroke}" stroke-width="1.2" />`,
    `</g>`,
    rectMarkup({
      id: "canvasBoundary",
      x: shell.x + 20,
      y: shell.y + 20,
      width: shell.width - 40,
      height: shell.height - 40,
    }),
    renderHeader({ copy, report, header, theme }),
    renderLegend({ copy, chartCard, theme }),
    renderSection({
      copy,
      section: {
        key: "relayTurnFirstAudioDelayMs",
        title: copy.firstSectionTitle,
        subtitle: copy.firstSectionSubtitle,
        top: chartCard.y + 40,
        plotTop: chartCard.y + 122,
        plotHeight: 216,
        xMaxSec: 16,
      },
      report,
      chartCard,
      theme,
    }),
    renderSection({
      copy,
      section: {
        key: "relayTurnHandoffSilenceMs",
        title: copy.handoffSectionTitle,
        subtitle: copy.handoffSectionSubtitle,
        top: chartCard.y + 368,
        plotTop: chartCard.y + 450,
        plotHeight: 216,
        xMaxSec: 16,
      },
      report,
      chartCard,
      theme,
    }),
    renderSummaryColumn({ copy, report, summaryColumn, theme, locale }),
    renderFooter({ copy, footer, theme, locale }),
    `</svg>`,
  ];

  return parts.join("\n");
}

function renderHeader({ copy, report, header, theme }) {
  const left = header.x + 38;
  const right = header.x + header.width - 42;
  const textWidth = 960;
  const titleBlock = renderTextBlock({
    id: "headerTitle",
    x: left,
    y: header.y + 34,
    width: textWidth,
    height: 64,
    text: copy.title,
    fontSize: 60,
    minFontSize: 44,
    maxLines: 1,
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontWeight: 700,
    fill: "#f9fcff",
    boundaryId: "canvasBoundary",
  });
  const subtitleBlock = renderTextBlock({
    id: "headerSubtitle",
    x: left,
    y: header.y + 112,
    width: textWidth,
    height: 28,
    text: copy.subtitle,
    fontSize: 24,
    minFontSize: 20,
    maxLines: 1,
    fontFamily: "'Segoe UI', 'Yu Gothic UI', sans-serif",
    fontWeight: 500,
    fill: theme.textSoft,
    boundaryId: "canvasBoundary",
  });
  const bodyBlock = renderTextBlock({
    id: "headerBody",
    x: left,
    y: header.y + 156,
    width: textWidth,
    height: 50,
    text: copy.body,
    fontSize: 20,
    minFontSize: 17,
    maxLines: 2,
    fontFamily: "'Segoe UI', 'Yu Gothic UI', sans-serif",
    fontWeight: 500,
    fill: "#d4e0e5",
    boundaryId: "canvasBoundary",
    lineHeight: 24,
  });

  return [
    titleBlock.markup,
    subtitleBlock.markup,
    bodyBlock.markup,
    renderKpiCard({
      idPrefix: "firstAudioCard",
      title: copy.firstCardTitle,
      data: report.overallCards.firstAudio,
      x: right - 550,
      y: header.y + 28,
      width: 252,
      height: 122,
      accent: theme.chipA,
      theme,
      copy,
    }),
    renderKpiCard({
      idPrefix: "handoffCard",
      title: copy.handoffCardTitle,
      data: report.overallCards.handoff,
      x: right - 276,
      y: header.y + 28,
      width: 252,
      height: 122,
      accent: theme.chipB,
      theme,
      copy,
    }),
  ].join("\n");
}

function renderKpiCard({
  idPrefix,
  title,
  data,
  x,
  y,
  width,
  height,
  accent,
  theme,
  copy,
}) {
  const gainText =
    copy === localeCopy.en
      ? `${data.gainSec.toFixed(2)}s ${copy.faster} | ${data.gainPct.toFixed(1)}% ${copy.lower}`
      : `${data.gainSec.toFixed(2)}秒 ${copy.faster} | ${data.gainPct.toFixed(1)}% ${copy.lower}`;

  return [
    `<rect id="${idPrefix}Boundary" x="${x}" y="${y}" width="${width}" height="${height}" rx="22" fill="${theme.cardTint}" stroke="#dce6ea" stroke-width="1.2" />`,
    `<path d="M ${x + 20} ${y + 18} h 54" stroke="${accent}" stroke-width="8" stroke-linecap="round" />`,
    renderTextBlock({
      id: `${idPrefix}Title`,
      x: x + 18,
      y: y + 22,
      width: width - 36,
      height: 22,
      text: title,
      fontSize: 17,
      minFontSize: 14,
      maxLines: 1,
      fontFamily: "'Segoe UI', 'Yu Gothic UI', sans-serif",
      fontWeight: 700,
      fill: "#3a4b57",
      boundaryId: `${idPrefix}Boundary`,
    }).markup,
    renderTextBlock({
      id: `${idPrefix}Primary`,
      x: x + 18,
      y: y + 52,
      width: 106,
      height: 34,
      text: `${data.streamingSec.toFixed(2)}s`,
      fontSize: 24,
      minFontSize: 22,
      maxLines: 1,
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontWeight: 700,
      fill: theme.textPrimary,
      boundaryId: `${idPrefix}Boundary`,
    }).markup,
    renderTextBlock({
      id: `${idPrefix}Versus`,
      x: x + 118,
      y: y + 58,
      width: width - 136,
      height: 22,
      text: `vs ${data.batchSec.toFixed(2)}s`,
      fontSize: 18,
      minFontSize: 15,
      maxLines: 1,
      fontFamily: "'Segoe UI', 'Yu Gothic UI', sans-serif",
      fontWeight: 500,
      fill: theme.textMuted,
      boundaryId: `${idPrefix}Boundary`,
    }).markup,
    renderTextBlock({
      id: `${idPrefix}Gain`,
      x: x + 18,
      y: y + 88,
      width: width - 36,
      height: 20,
      text: gainText,
      fontSize: 16,
      minFontSize: 14,
      maxLines: 1,
      fontFamily: "'Segoe UI', 'Yu Gothic UI', sans-serif",
      fontWeight: 700,
      fill: accent === theme.chipA ? theme.streaming : theme.batchDark,
      boundaryId: `${idPrefix}Boundary`,
    }).markup,
  ].join("\n");
}

function renderLegend({ copy, chartCard, theme }) {
  const x = chartCard.x + chartCard.width - 270;
  const y = chartCard.y + 28;
  return [
    {
      id: "legendStreaming",
      label: copy.streaming,
      color: theme.streaming,
      x,
    },
    {
      id: "legendBatch",
      label: copy.batch,
      color: theme.batch,
      x: x + 120,
    },
  ]
    .map((item) =>
      [
        `<rect x="${item.x}" y="${y + 2}" width="14" height="14" rx="4" fill="${item.color}" />`,
        renderTextBlock({
          id: `${item.id}Text`,
          x: item.x + 24,
          y,
          width: 92,
          height: 18,
          text: item.label,
          fontSize: 16,
          minFontSize: 13,
          maxLines: 1,
          fontFamily: "'Segoe UI', 'Yu Gothic UI', sans-serif",
          fontWeight: 600,
          fill: theme.textMuted,
          boundaryId: "canvasBoundary",
        }).markup,
      ].join("\n")
    )
    .join("\n");
}

function renderSection({ copy, section, report, chartCard, theme }) {
  const sectionBoundaryId = `${section.key}SectionBoundary`;
  const plotBoundaryId = `${section.key}PlotBoundary`;
  const leftPadding = chartCard.x + 40;
  const plotLeft = chartCard.x + 174;
  const plotRight = chartCard.x + chartCard.width - 54;
  const plotWidth = plotRight - plotLeft;
  const groupGap = 76;
  const barHeight = 18;
  const rowGap = 14;
  const axisBottom = section.plotTop + section.plotHeight;

  const parts = [
    rectMarkup({
      id: sectionBoundaryId,
      x: chartCard.x + 18,
      y: section.top - 10,
      width: chartCard.width - 36,
      height: section.plotHeight + 110,
    }),
    rectMarkup({
      id: plotBoundaryId,
      x: plotLeft - 24,
      y: section.plotTop - 8,
      width: plotWidth + 48,
      height: section.plotHeight + 60,
    }),
    renderTextBlock({
      id: `${section.key}Title`,
      x: leftPadding,
      y: section.top,
      width: 520,
      height: 32,
      text: section.title,
      fontSize: 26,
      minFontSize: 21,
      maxLines: 1,
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontWeight: 700,
      fill: theme.textPrimary,
      boundaryId: sectionBoundaryId,
    }).markup,
    renderTextBlock({
      id: `${section.key}Subtitle`,
      x: leftPadding,
      y: section.top + 32,
      width: 720,
      height: 38,
      text: section.subtitle,
      fontSize: 18,
      minFontSize: 15,
      maxLines: 2,
      fontFamily: "'Segoe UI', 'Yu Gothic UI', sans-serif",
      fontWeight: 500,
      fill: theme.textMuted,
      boundaryId: sectionBoundaryId,
      lineHeight: 22,
    }).markup,
  ];

  for (let tick = 0; tick <= section.xMaxSec; tick += 2) {
    const x = plotLeft + (tick / section.xMaxSec) * plotWidth;
    parts.push(
      `<line x1="${x}" y1="${section.plotTop}" x2="${x}" y2="${axisBottom}" stroke="${theme.grid}" stroke-width="1" />`
    );
    parts.push(
      renderTextBlock({
        id: `${section.key}Tick${tick}`,
        x: x - 28,
        y: axisBottom + 10,
        width: 56,
        height: 18,
        text: `${tick}s`,
        fontSize: 14,
        minFontSize: 12,
        maxLines: 1,
        fontFamily: "'Segoe UI', 'Yu Gothic UI', sans-serif",
        fontWeight: 500,
        fill: theme.textMuted,
        boundaryId: plotBoundaryId,
        align: "center",
      }).markup
    );
  }

  topics.forEach((topic, index) => {
    const groupTop = section.plotTop + index * groupGap;
    const topicLabel = copy === localeCopy.ja ? topic.ja : topic.en;
    const topicStats = report.statsByTopic[topic.key];
    const streamingStat = topicStats.streaming[section.key];
    const batchStat = topicStats.batch[section.key];
    const yStreaming = groupTop + 6;
    const yBatch = yStreaming + barHeight + rowGap;

    parts.push(
      renderTextBlock({
        id: `${section.key}${topic.key}Topic`,
        x: leftPadding,
        y: groupTop - 18,
        width: 146,
        height: 18,
        text: topicLabel,
        fontSize: 17,
        minFontSize: 14,
        maxLines: 1,
        fontFamily: "'Segoe UI', 'Yu Gothic UI', sans-serif",
        fontWeight: 700,
        fill: theme.textPrimary,
        boundaryId: sectionBoundaryId,
      }).markup
    );
    parts.push(
      renderBar({
        idPrefix: `${section.key}${topic.key}Streaming`,
        boundaryId: plotBoundaryId,
        x: plotLeft,
        y: yStreaming,
        valueSec: streamingStat.meanSec,
        stdDevSec: streamingStat.stdDevSec,
        maxSec: section.xMaxSec,
        plotWidth,
        barHeight,
        fill: theme.streaming,
        stroke: theme.streamingDark,
        textColor: theme.textPrimary,
      })
    );
    parts.push(
      renderBar({
        idPrefix: `${section.key}${topic.key}Batch`,
        boundaryId: plotBoundaryId,
        x: plotLeft,
        y: yBatch,
        valueSec: batchStat.meanSec,
        stdDevSec: batchStat.stdDevSec,
        maxSec: section.xMaxSec,
        plotWidth,
        barHeight,
        fill: theme.batch,
        stroke: theme.batchDark,
        textColor: theme.textPrimary,
      })
    );
  });

  return parts.join("\n");
}

function renderBar({
  idPrefix,
  boundaryId,
  x,
  y,
  valueSec,
  stdDevSec,
  maxSec,
  plotWidth,
  barHeight,
  fill,
  stroke,
  textColor,
}) {
  const barWidth = (valueSec / maxSec) * plotWidth;
  const meanX = x + barWidth;
  const sdStart = x + (Math.max(0, valueSec - stdDevSec) / maxSec) * plotWidth;
  const sdEnd = x + (Math.min(maxSec, valueSec + stdDevSec) / maxSec) * plotWidth;
  const valueLabel = `${valueSec.toFixed(2)}s`;
  const labelWidth = estimateTextWidth(valueLabel, 16);
  const plotRight = x + plotWidth;
  const labelAfterX = meanX + 12;
  const fitsAfter = labelAfterX + labelWidth <= plotRight - 4;
  const labelX = fitsAfter ? labelAfterX : Math.max(x + labelWidth + 8, meanX - 10);
  const anchor = fitsAfter ? "start" : "end";

  return [
    `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="9" fill="${fill}" opacity="0.96" />`,
    `<line x1="${sdStart}" y1="${y + barHeight / 2}" x2="${sdEnd}" y2="${y + barHeight / 2}" stroke="${stroke}" stroke-width="3" stroke-linecap="round" />`,
    `<text id="${idPrefix}Value" data-fit-boundary="${boundaryId}" x="${labelX}" y="${y + 15}" text-anchor="${anchor}" fill="${textColor}" font-family="'Segoe UI', 'Yu Gothic UI', sans-serif" font-size="16" font-weight="700">${escapeXml(valueLabel)}</text>`,
  ].join("\n");
}

function renderSummaryColumn({ copy, report, summaryColumn, theme, locale }) {
  const cards = topics.map((topic, index) =>
    renderTopicCard({
      topic,
      copy,
      locale,
      stats: report.statsByTopic[topic.key],
      x: summaryColumn.x,
      y: summaryColumn.y + 36 + index * 217,
      width: summaryColumn.width,
      height: 206,
      theme,
    })
  );

  return [
    renderTextBlock({
      id: "summaryTitle",
      x: summaryColumn.x,
      y: summaryColumn.y - 6,
      width: summaryColumn.width,
      height: 28,
      text: copy.summaryTitle,
      fontSize: 24,
      minFontSize: 20,
      maxLines: 1,
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontWeight: 700,
      fill: theme.textPrimary,
      boundaryId: "canvasBoundary",
    }).markup,
    ...cards,
  ].join("\n");
}

function renderTopicCard({ topic, copy, locale, stats, x, y, width, height, theme }) {
  const idPrefix = `${topic.key}Card`;
  const title = locale === "ja" ? topic.ja : topic.en;
  const first = stats.streaming.relayTurnFirstAudioDelayMs;
  const firstBatch = stats.batch.relayTurnFirstAudioDelayMs;
  const handoff = stats.streaming.relayTurnHandoffSilenceMs;
  const handoffBatch = stats.batch.relayTurnHandoffSilenceMs;
  const noteLine = locale === "ja" ? topic.noteJa : topic.noteEn;

  return [
    `<rect id="${idPrefix}Boundary" x="${x}" y="${y}" width="${width}" height="${height}" rx="28" fill="${theme.cardTint}" stroke="#dce4e8" stroke-width="1.1" />`,
    renderTextBlock({
      id: `${idPrefix}Title`,
      x: x + 28,
      y: y + 24,
      width: width - 56,
      height: 30,
      text: title,
      fontSize: 26,
      minFontSize: 21,
      maxLines: 1,
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontWeight: 700,
      fill: theme.textPrimary,
      boundaryId: `${idPrefix}Boundary`,
    }).markup,
    renderTextBlock({
      id: `${idPrefix}Body`,
      x: x + 28,
      y: y + 64,
      width: width - 56,
      height: 18,
      text: copy.cardBody,
      fontSize: 14,
      minFontSize: 13,
      maxLines: 1,
      fontFamily: "'Segoe UI', 'Yu Gothic UI', sans-serif",
      fontWeight: 500,
      fill: theme.textMuted,
      boundaryId: `${idPrefix}Boundary`,
    }).markup,
    renderStatLine({
      id: `${idPrefix}First`,
      boundaryId: `${idPrefix}Boundary`,
      x: x + 28,
      y: y + 94,
      width: width - 56,
      label: copy.labelFirst,
      primary: `${first.meanSec.toFixed(2)}s`,
      secondary: `${firstBatch.meanSec.toFixed(2)}s`,
      theme,
    }),
    renderStatLine({
      id: `${idPrefix}FirstVar`,
      boundaryId: `${idPrefix}Boundary`,
      x: x + 28,
      y: y + 116,
      width: width - 56,
      label: copy.labelVariance,
      primary: `${first.varianceSec2.toFixed(2)} s²`,
      secondary: `${firstBatch.varianceSec2.toFixed(2)} s²`,
      theme,
      smaller: true,
    }),
    renderStatLine({
      id: `${idPrefix}Handoff`,
      boundaryId: `${idPrefix}Boundary`,
      x: x + 28,
      y: y + 140,
      width: width - 56,
      label: copy.labelHandoff,
      primary: `${handoff.meanSec.toFixed(2)}s`,
      secondary: `${handoffBatch.meanSec.toFixed(2)}s`,
      theme,
    }),
    renderStatLine({
      id: `${idPrefix}HandoffVar`,
      boundaryId: `${idPrefix}Boundary`,
      x: x + 28,
      y: y + 162,
      width: width - 56,
      label: copy.labelVariance,
      primary: `${handoff.varianceSec2.toFixed(2)} s²`,
      secondary: `${handoffBatch.varianceSec2.toFixed(2)} s²`,
      theme,
      smaller: true,
    }),
    renderTextBlock({
      id: `${idPrefix}Note`,
      x: x + 28,
      y: y + 184,
      width: width - 56,
      height: 18,
      text: noteLine,
      fontSize: 13,
      minFontSize: 12,
      maxLines: 1,
      fontFamily: "'Segoe UI', 'Yu Gothic UI', sans-serif",
      fontWeight: 500,
      fill: theme.textMuted,
      boundaryId: `${idPrefix}Boundary`,
    }).markup,
  ].join("\n");
}

function renderStatLine({
  id,
  boundaryId,
  x,
  y,
  width,
  label,
  primary,
  secondary,
  theme,
  smaller = false,
}) {
  const fontSize = smaller ? 14 : 15;
  const weight = smaller ? 500 : 700;
  return [
    renderTextBlock({
      id: `${id}Label`,
      x,
      y,
      width: 170,
      height: 18,
      text: label,
      fontSize,
      minFontSize: smaller ? 12 : 13,
      maxLines: 1,
      fontFamily: "'Segoe UI', 'Yu Gothic UI', sans-serif",
      fontWeight: weight,
      fill: smaller ? theme.textMuted : theme.textPrimary,
      boundaryId,
    }).markup,
    renderTextBlock({
      id: `${id}Primary`,
      x: x + 160,
      y,
      width: 110,
      height: 18,
      text: primary,
      fontSize,
      minFontSize: smaller ? 12 : 13,
      maxLines: 1,
      fontFamily: "'Segoe UI', 'Yu Gothic UI', sans-serif",
      fontWeight: weight,
      fill: theme.streaming,
      boundaryId,
      align: "end",
    }).markup,
    renderTextBlock({
      id: `${id}Vs`,
      x: x + 282,
      y,
      width: 30,
      height: 18,
      text: "vs",
      fontSize,
      minFontSize: smaller ? 12 : 13,
      maxLines: 1,
      fontFamily: "'Segoe UI', 'Yu Gothic UI', sans-serif",
      fontWeight: 500,
      fill: theme.textMuted,
      boundaryId,
      align: "center",
    }).markup,
    renderTextBlock({
      id: `${id}Secondary`,
      x: x + 326,
      y,
      width: 120,
      height: 18,
      text: secondary,
      fontSize,
      minFontSize: smaller ? 12 : 13,
      maxLines: 1,
      fontFamily: "'Segoe UI', 'Yu Gothic UI', sans-serif",
      fontWeight: weight,
      fill: theme.batch,
      boundaryId,
      align: "end",
    }).markup,
  ].join("\n");
}

function renderFooter({ copy, footer, theme }) {
  const leftBoundaryId = "footerLeftBoundary";
  const rightBoundaryId = "footerRightBoundary";
  return [
    rectMarkup({
      id: leftBoundaryId,
      x: footer.x + 28,
      y: footer.y + 18,
      width: 760,
      height: footer.height - 36,
    }),
    rectMarkup({
      id: rightBoundaryId,
      x: footer.x + 836,
      y: footer.y + 18,
      width: 744,
      height: footer.height - 36,
    }),
    renderTextBlock({
      id: "footerTitle",
      x: footer.x + 28,
      y: footer.y + 20,
      width: 420,
      height: 26,
      text: copy.methodologyTitle,
      fontSize: 24,
      minFontSize: 20,
      maxLines: 1,
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontWeight: 700,
      fill: theme.textPrimary,
      boundaryId: leftBoundaryId,
    }).markup,
    ...copy.methodologyBullets.map((line, index) =>
      renderBulletLine({
        id: `footerMethod${index + 1}`,
        boundaryId: leftBoundaryId,
        x: footer.x + 28,
        y: footer.y + 56 + index * 24,
        width: 760,
        text: line,
        theme,
      })
    ),
    ...copy.pathSummaryLines.map((line, index) =>
      renderBulletLine({
        id: `footerPath${index + 1}`,
        boundaryId: rightBoundaryId,
        x: footer.x + 836,
        y: footer.y + 56 + index * 24,
        width: 744,
        text: line,
        theme,
      })
    ),
  ].join("\n");
}

function renderBulletLine({ id, boundaryId, x, y, width, text, theme }) {
  return [
    `<circle cx="${x + 8}" cy="${y + 8}" r="4" fill="${theme.streaming}" />`,
    renderTextBlock({
      id,
      x: x + 22,
      y,
      width: width - 22,
      height: 18,
      text,
      fontSize: 15,
      minFontSize: 13,
      maxLines: 1,
      fontFamily: "'Segoe UI', 'Yu Gothic UI', sans-serif",
      fontWeight: 500,
      fill: theme.textMuted,
      boundaryId,
    }).markup,
  ].join("\n");
}

async function renderSvgToPng({ browser, svg, pngPath, canvas: svgCanvas }) {
  const page = await browser.newPage({
    viewport: { width: svgCanvas.width, height: svgCanvas.height },
    deviceScaleFactor: 1,
  });

  try {
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8" /><style>html,body{margin:0;padding:0;background:transparent;}svg{display:block;}</style></head><body>${svg}</body></html>`
    );
    await page.locator("svg").screenshot({ path: pngPath, type: "png" });
  } finally {
    await page.close();
  }
}

async function writeHistoryArtifacts({ report, sourceKind }) {
  const entry = buildHistoryEntry({ report, sourceKind });
  const history = await readHistoryEntries();
  const nextHistory = upsertHistoryEntry(history, entry);

  await fs.writeFile(historyJsonPath, JSON.stringify(nextHistory, null, 2), "utf8");
  await fs.writeFile(historyCsvPath, buildHistoryCsv(nextHistory), "utf8");
}

function buildHistoryEntry({ report, sourceKind }) {
  const gitSha = getGitSha();
  const benchmarkKey = "podcast-natural-ja-3topics-6turns-3runs";
  return {
    generatedAt: report.generatedAt,
    benchmarkKey,
    gitSha,
    sourceKind,
    topics: topics.map((topic) => topic.en),
    firstAudioStreamingSec: report.overallCards.firstAudio.streamingSec,
    firstAudioBatchSec: report.overallCards.firstAudio.batchSec,
    firstAudioGainSec: report.overallCards.firstAudio.gainSec,
    firstAudioGainPct: report.overallCards.firstAudio.gainPct,
    handoffStreamingSec: report.overallCards.handoff.streamingSec,
    handoffBatchSec: report.overallCards.handoff.batchSec,
    handoffGainSec: report.overallCards.handoff.gainSec,
    handoffGainPct: report.overallCards.handoff.gainPct,
  };
}

async function readHistoryEntries() {
  try {
    const history = await readJson(historyJsonPath);
    return Array.isArray(history) ? history : [];
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function upsertHistoryEntry(history, entry) {
  const entryKey = `${entry.benchmarkKey}|${entry.gitSha}|${entry.firstAudioStreamingSec}|${entry.firstAudioBatchSec}|${entry.handoffStreamingSec}|${entry.handoffBatchSec}|${entry.sourceKind}`;
  const existingIndex = history.findIndex((item) => {
    const itemKey = `${item.benchmarkKey}|${item.gitSha}|${item.firstAudioStreamingSec}|${item.firstAudioBatchSec}|${item.handoffStreamingSec}|${item.handoffBatchSec}|${item.sourceKind}`;
    return itemKey === entryKey;
  });

  if (existingIndex >= 0) {
    const nextHistory = [...history];
    nextHistory[existingIndex] = { ...nextHistory[existingIndex], ...entry };
    return nextHistory;
  }

  return [...history, entry];
}

function buildHistoryCsv(history) {
  const headers = [
    "generatedAt",
    "benchmarkKey",
    "gitSha",
    "sourceKind",
    "topics",
    "firstAudioStreamingSec",
    "firstAudioBatchSec",
    "firstAudioGainSec",
    "firstAudioGainPct",
    "handoffStreamingSec",
    "handoffBatchSec",
    "handoffGainSec",
    "handoffGainPct",
  ];

  const rows = history.map((entry) =>
    [
      entry.generatedAt,
      entry.benchmarkKey,
      entry.gitSha,
      entry.sourceKind,
      entry.topics.join("|"),
      entry.firstAudioStreamingSec,
      entry.firstAudioBatchSec,
      entry.firstAudioGainSec,
      entry.firstAudioGainPct,
      entry.handoffStreamingSec,
      entry.handoffBatchSec,
      entry.handoffGainSec,
      entry.handoffGainPct,
    ]
      .map(csvEscape)
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

function getGitSha() {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

function rectMarkup({ id, x, y, width, height }) {
  return `<rect id="${id}" x="${x}" y="${y}" width="${width}" height="${height}" fill="transparent" opacity="0" pointer-events="none" />`;
}

function renderTextBlock({
  id,
  x,
  y,
  width,
  height,
  text,
  fontSize,
  minFontSize,
  maxLines,
  fontFamily,
  fontWeight,
  fill,
  boundaryId,
  align = "start",
  lineHeight = null,
}) {
  let resolvedFontSize = fontSize;
  let lines = wrapText(text, width, resolvedFontSize, maxLines);
  let resolvedLineHeight = lineHeight || Math.round(resolvedFontSize * 1.25);

  while (
    resolvedFontSize > minFontSize &&
    (lines.length > maxLines ||
      resolvedFontSize + (lines.length - 1) * resolvedLineHeight > height)
  ) {
    resolvedFontSize -= 1;
    resolvedLineHeight = lineHeight || Math.round(resolvedFontSize * 1.25);
    lines = wrapText(text, width, resolvedFontSize, maxLines);
  }

  if (lines.length > maxLines) {
    lines = [
      ...lines.slice(0, maxLines - 1),
      truncateTextToWidth(lines.slice(maxLines - 1).join(""), width, resolvedFontSize),
    ];
  }

  const anchor =
    align === "center" ? "middle" : align === "end" ? "end" : "start";
  const textX =
    align === "center" ? x + width / 2 : align === "end" ? x + width : x;
  const firstBaseline = y + resolvedFontSize;
  const tspans = lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : resolvedLineHeight;
      return `<tspan x="${textX}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  return {
    markup: `<text id="${id}" data-fit-boundary="${boundaryId}" x="${textX}" y="${firstBaseline}" text-anchor="${anchor}" fill="${fill}" font-family="${fontFamily}" font-size="${resolvedFontSize}" font-weight="${fontWeight}">${tspans}</text>`,
  };
}

function wrapText(text, maxWidth, fontSize, maxLines) {
  const tokens = tokenizeForWrap(text);
  if (tokens.length === 0) {
    return [""];
  }

  const lines = [];
  let current = tokens[0];

  for (let index = 1; index < tokens.length; index += 1) {
    const candidate = current + tokens[index];
    if (estimateTextWidth(candidate, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }

    lines.push(current.trim());
    current = tokens[index].trimStart();

    if (lines.length === maxLines - 1) {
      const rest = [current, ...tokens.slice(index + 1)].join("");
      lines.push(truncateTextToWidth(rest.trim(), maxWidth, fontSize));
      return lines;
    }
  }

  lines.push(current.trim());
  return lines;
}

function tokenizeForWrap(text) {
  if (text.trim().length === 0) {
    return [];
  }
  if (/\s/.test(text)) {
    return text.split(/(\s+)/).filter(Boolean);
  }
  return Array.from(text);
}

function truncateTextToWidth(text, maxWidth, fontSize) {
  if (estimateTextWidth(text, fontSize) <= maxWidth) {
    return text;
  }

  let truncated = text;
  while (
    truncated.length > 1 &&
    estimateTextWidth(`${truncated}...`, fontSize) > maxWidth
  ) {
    truncated = truncated.slice(0, -1);
  }

  return `${truncated.trimEnd()}...`;
}

function estimateTextWidth(text, fontSize) {
  let width = 0;
  for (const char of text) {
    if (/\s/.test(char)) {
      width += fontSize * 0.33;
    } else if (/[0-9]/.test(char)) {
      width += fontSize * 0.56;
    } else if (/[A-Z]/.test(char)) {
      width += fontSize * 0.64;
    } else if (/[a-z]/.test(char)) {
      width += fontSize * 0.54;
    } else if (/[.,:;|]/.test(char)) {
      width += fontSize * 0.28;
    } else if (/[()/%]/.test(char)) {
      width += fontSize * 0.42;
    } else if (/[\u3040-\u30ff\u3400-\u9fff]/.test(char)) {
      width += fontSize * 0.96;
    } else {
      width += fontSize * 0.58;
    }
  }
  return width;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleVariance(values) {
  if (values.length < 2) {
    return 0;
  }
  const average = mean(values);
  return values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1);
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
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
