import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const targetUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:3100/";
const apiKey =
  process.env.E2E_GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  (await resolveApiKeyFromDotEnv());
const topic =
  process.env.E2E_PODCAST_BENCH_TOPIC ||
  "Keep the exchange brief: one short sentence each about AI agents and local models.";
const requestTimeoutMs = Number(process.env.E2E_TIMEOUT_MS || 480000);
const startupTimeoutMs = Number(process.env.E2E_STARTUP_TIMEOUT_MS || 60000);
const rawIterations = Number.parseInt(
  String(process.env.E2E_BENCH_ITERATIONS || 2),
  10,
);
const iterationsPerMode = Number.isNaN(rawIterations)
  ? 2
  : Math.min(Math.max(rawIterations, 1), 6);
const rawPodcastTurnCount = Number.parseInt(
  String(process.env.E2E_BENCH_TURN_COUNT || 6),
  10,
);
const podcastTurnCount = Number.isNaN(rawPodcastTurnCount)
  ? 6
  : Math.min(Math.max(rawPodcastTurnCount, 2), 6);
const artifactDir =
  process.env.E2E_BENCH_ARTIFACT_DIR ||
  path.join(process.cwd(), ".tmp-benchmark-podcast-relay");
const benchmarkModes = buildBenchmarkModes(iterationsPerMode);

if (!apiKey) {
  throw new Error(
    "Podcast relay benchmark requires E2E_GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY.",
  );
}

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  await waitForServer(targetUrl, startupTimeoutMs);

  for (let index = 0; index < benchmarkModes.length; index += 1) {
    const mode = benchmarkModes[index];
    const perModeIndex =
      results.filter((result) => result.mode === mode).length + 1;
    const result = await runBenchmarkIteration(browser, {
      artifactDir,
      apiKey,
      mode,
      perModeIndex,
      podcastTurnCount,
      requestTimeoutMs,
      targetUrl,
      topic,
    });
    results.push(result);
  }

  const summary = summarizeBenchmarkResults({
    iterationsPerMode,
    podcastTurnCount,
    results,
    targetUrl,
    topic,
  });
  await mkdir(artifactDir, { recursive: true });
  await writeFile(
    path.join(artifactDir, "benchmark-summary.json"),
    JSON.stringify(summary, null, 2),
    "utf8",
  );
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}

async function runBenchmarkIteration(
  browser,
  {
    artifactDir,
    apiKey,
    mode,
    perModeIndex,
    podcastTurnCount,
    requestTimeoutMs,
    targetUrl,
    topic,
  },
) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const failedRequests = [];
  const blockingConsoleErrors = [];
  const pageErrors = [];
  let lastKnownState = null;

  page.on("requestfailed", (request) => {
    failedRequests.push({
      url: request.url(),
      errorText: request.failure()?.errorText ?? "unknown",
    });
  });

  page.on("console", (message) => {
    if (message.type() !== "error") {
      return;
    }

    const text = message.text();
    const blockingPatterns = [
      "ChunkLoadError",
      "PixivIconLoadError",
      "invalid argument",
      "Gemini Live audio relay",
      "Podcast mode failed",
    ];

    if (blockingPatterns.some((pattern) => text.toLowerCase().includes(pattern.toLowerCase()))) {
      blockingConsoleErrors.push(text);
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.stack || error.message);
  });

  try {
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    await configureBenchmarkFlags(page, mode);
    await ensureExternalControl(page);
    await setGeminiApiKey(page, apiKey);

    const startButton = page.getByRole("button", { name: /start/i });
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
      await startButton.waitFor({ state: "hidden" }).catch(() => {});
    }

    await page.evaluate(async () => {
      await window.geminiVrmControl.setInteractionMode("podcast");
    });
    await waitForExternalControlState(
      page,
      () => {
        const state = window.geminiVrmControl?.getState?.();
        return Boolean(
          state &&
            state.interactionMode === "podcast" &&
            state.podcastViewerReady?.yukito === true &&
            state.podcastViewerReady?.kiyoka === true,
        );
      },
      undefined,
      requestTimeoutMs,
      "podcast mode and viewer readiness",
    );

    await page.evaluate(async (nextTurnCount) => {
      await window.geminiVrmControl.updatePodcastSettings({
        podcastTurnCount: nextTurnCount,
      });
      await window.geminiVrmControl.resetConversation("podcast");
    }, podcastTurnCount);
    await waitForExternalControlState(
      page,
      (expectedTurnCount) => {
        const state = window.geminiVrmControl?.getState?.();
        return Boolean(
          state &&
            state.interactionMode === "podcast" &&
            state.chatProcessing === false &&
            Array.isArray(state.podcastLog) &&
            state.podcastLog.length === 0 &&
            state.podcastTurnCount === expectedTurnCount,
        );
      },
      podcastTurnCount,
      requestTimeoutMs,
      "podcast reset state",
    );

    await page.evaluate(
      async ({ nextTopic }) => {
        await window.geminiVrmControl.sendMessage(nextTopic, "Benchmark");
      },
      { nextTopic: topic },
    );

    await waitForExternalControlState(
      page,
      (expectedTurnCount) => {
        const state = window.geminiVrmControl?.getState?.();
        return Boolean(
          state &&
            state.chatProcessing === false &&
            state.assistantStatus === "Podcast finished." &&
            Array.isArray(state.podcastLog) &&
            state.podcastLog.length >= expectedTurnCount,
        );
      },
      podcastTurnCount,
      requestTimeoutMs,
      "podcast benchmark completion",
    );

    const finalState = await getExternalControlState(page);
    lastKnownState = finalState;
    const debugEvents = await page.evaluate(
      () => window.__geminiVrmPodcastDebugEvents ?? [],
    );

    if (blockingConsoleErrors.length > 0) {
      throw new Error(
        `Blocking console errors detected:\n${blockingConsoleErrors.join("\n")}`,
      );
    }

    if (pageErrors.length > 0) {
      throw new Error(`Page errors detected:\n${pageErrors.join("\n")}`);
    }

    if (failedRequests.some((request) => request.url.includes("favicon.ico"))) {
      throw new Error(
        `Failed requests detected:\n${JSON.stringify(failedRequests, null, 2)}`,
      );
    }

    const metrics = computeBenchmarkMetrics({
      mode,
      debugEvents,
      podcastTurnCount,
    });

    return {
      mode,
      perModeIndex,
      podcastTurnCount,
      finalState: {
        assistantStatus: finalState.assistantStatus,
        podcastLogLength: finalState.podcastLog.length,
      },
      metrics,
    };
  } catch (error) {
    lastKnownState = await getExternalControlState(page).catch(() => lastKnownState);
    const debugEvents = await page
      .evaluate(() => window.__geminiVrmPodcastDebugEvents ?? [])
      .catch(() => []);
    await writeBenchmarkArtifacts({
      artifactDir,
      debugEvents,
      error,
      lastKnownState,
      mode,
      page,
      perModeIndex,
    });
    throw error;
  } finally {
    await context.close();
  }
}

async function configureBenchmarkFlags(page, mode) {
  await page.evaluate((nextMode) => {
    window.localStorage.setItem("geminiVrmExternalControl", "true");
    window.localStorage.setItem("podcastDebug", "true");
    window.localStorage.setItem("podcastRelayMode", nextMode);
  }, mode);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
}

async function setGeminiApiKey(page, key) {
  const keyInput = page
    .locator("#intro-gemini-api-key, #settings-gemini-api-key")
    .first();

  await keyInput.waitFor({ state: "attached", timeout: 10000 });
  await keyInput.evaluate((element, value) => {
    const input = element;
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    );

    descriptor?.set?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, key);
  await waitForExternalControlState(
    page,
    () => Boolean(window.geminiVrmControl?.getState?.()?.hasGeminiApiKey),
    undefined,
    10000,
    "Gemini API key acceptance",
  );
}

async function ensureExternalControl(page) {
  await page.waitForFunction(
    () =>
      typeof window.geminiVrmControl?.getState === "function" &&
      typeof window.geminiVrmControl?.setInteractionMode === "function" &&
      typeof window.geminiVrmControl?.updatePodcastSettings === "function" &&
      typeof window.geminiVrmControl?.sendMessage === "function" &&
      typeof window.geminiVrmControl?.resetConversation === "function",
    { timeout: 30000 },
  );
}

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if ((response.status >= 200 && response.status < 400) || response.status === 304) {
        return;
      }
    } catch {
      // Keep polling until timeout.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    `Dev server was not reachable at ${url} within ${timeoutMs}ms. Start it with "npm run dev -- --hostname 127.0.0.1 --port 3100" and retry.`,
  );
}

async function getExternalControlState(page) {
  return page.evaluate(() => window.geminiVrmControl?.getState?.() ?? null);
}

async function waitForExternalControlState(
  page,
  predicate,
  arg,
  timeoutMs,
  description,
) {
  try {
    await page.waitForFunction(predicate, arg, { timeout: timeoutMs });
  } catch (error) {
    const state = await getExternalControlState(page).catch(() => null);
    throw new Error(
      `Timed out waiting for ${description}. Last state:\n${JSON.stringify(
        state,
        null,
        2,
      )}`,
      { cause: error },
    );
  }
}

function computeBenchmarkMetrics({ mode, debugEvents, podcastTurnCount }) {
  const relayTurnIndices = Array.from(
    { length: Math.max(0, podcastTurnCount - 1) },
    (_, index) => index + 1,
  );
  const relayTurns = relayTurnIndices.map((turnIndex) => {
    const turnStart = findEvent(
      debugEvents,
      "turn-start",
      (event) => event.turnIndex === turnIndex,
    );
    const turnFirstAudio = findEvent(
      debugEvents,
      "turn-first-audio",
      (event) => event.turnIndex === turnIndex,
    );
    const turnComplete = findEvent(
      debugEvents,
      "turn-complete",
      (event) => event.turnIndex === turnIndex,
    );
    const turnPlaybackFinished = findEvent(
      debugEvents,
      "turn-playback-finished",
      (event) => event.turnIndex === turnIndex,
    );
    const previousTurnPlaybackFinished = findEvent(
      debugEvents,
      "turn-playback-finished",
      (event) => event.turnIndex === turnIndex - 1,
    );
    const batchRelayStart = findEvent(
      debugEvents,
      "batch-relay-start",
      (event) => event.turnIndex === turnIndex,
    );
    const preparedInputFirstChunk = findEvent(
      debugEvents,
      "prepared-relay-input-first-chunk",
      (event) => event.targetTurnIndex === turnIndex,
    );
    const preparedInputComplete = findEvent(
      debugEvents,
      "prepared-relay-input-complete",
      (event) => event.targetTurnIndex === turnIndex,
    );
    const preparedOutputFirstChunk = findEvent(
      debugEvents,
      "prepared-relay-output-first-chunk",
      (event) => event.targetTurnIndex === turnIndex,
    );
    const preparedOutputFirstPlayed = findEvent(
      debugEvents,
      "prepared-relay-output-first-played",
      (event) => event.targetTurnIndex === turnIndex,
    );

    return {
      turnIndex,
      firstAudioDelayMs: asFiniteNumber(turnFirstAudio?.firstAssistantAudioDelayMs),
      responseResolvedMs: asFiniteNumber(turnComplete?.turnDurationMs),
      playbackFinishedMs: asFiniteNumber(turnPlaybackFinished?.playbackFinishedDelayMs),
      handoffSilenceMs: diffPerf(turnFirstAudio, previousTurnPlaybackFinished),
      usedFallbackTextInput: Boolean(turnComplete?.usedFallbackTextInput),
      batchPostHandoffToFirstAudioMs: diffPerf(turnFirstAudio, batchRelayStart),
      preparedInputFirstChunkAfterPreviousTurnStartMs: diffPerf(
        preparedInputFirstChunk,
        findEvent(debugEvents, "turn-start", (event) => event.turnIndex === turnIndex - 1),
      ),
      preparedOutputReadyBeforeTurnStartMs: diffPerf(
        turnStart,
        preparedOutputFirstChunk,
      ),
      preparedOutputPlayedAfterTurnStartMs: diffPerf(
        preparedOutputFirstPlayed,
        turnStart,
      ),
      preparedInputLeadMs: diffPerf(
        preparedInputComplete,
        preparedOutputFirstChunk,
      ),
      proof: {
        sawPreparedInputChunk: Boolean(preparedInputFirstChunk),
        sawPreparedOutputChunk: Boolean(preparedOutputFirstChunk),
      },
    };
  });

  return {
    mode,
    expectedRelayTurns: relayTurnIndices.length,
    relayTurnIndices,
    relayTurns,
    relayTurnFirstAudioDelayMs: relayTurns
      .map((turn) => turn.firstAudioDelayMs)
      .filter((value) => Number.isFinite(value)),
    relayTurnResponseResolvedMs: relayTurns
      .map((turn) => turn.responseResolvedMs)
      .filter((value) => Number.isFinite(value)),
    relayTurnPlaybackFinishedMs: relayTurns
      .map((turn) => turn.playbackFinishedMs)
      .filter((value) => Number.isFinite(value)),
    relayTurnHandoffSilenceMs: relayTurns
      .map((turn) => turn.handoffSilenceMs)
      .filter((value) => Number.isFinite(value)),
    relayTurnBatchPostHandoffToFirstAudioMs: relayTurns
      .map((turn) => turn.batchPostHandoffToFirstAudioMs)
      .filter((value) => Number.isFinite(value)),
    transcriptFallbackTurnIndices: relayTurns
      .filter((turn) => turn.usedFallbackTextInput)
      .map((turn) => turn.turnIndex),
    preparedInputTurnIndices: relayTurns
      .filter((turn) => turn.proof.sawPreparedInputChunk)
      .map((turn) => turn.turnIndex),
    preparedOutputTurnIndices: relayTurns
      .filter((turn) => turn.proof.sawPreparedOutputChunk)
      .map((turn) => turn.turnIndex),
  };
}

function summarizeBenchmarkResults({
  iterationsPerMode,
  podcastTurnCount,
  results,
  targetUrl,
  topic,
}) {
  const grouped = {
    streaming: results.filter((result) => result.mode === "streaming"),
    batch: results.filter((result) => result.mode === "batch"),
  };
  const commonMetrics = [
    "relayTurnFirstAudioDelayMs",
    "relayTurnHandoffSilenceMs",
    "relayTurnResponseResolvedMs",
    "relayTurnPlaybackFinishedMs",
  ];

  const summaryByMode = Object.fromEntries(
    Object.entries(grouped).map(([mode, modeResults]) => {
      const flattened = {
        relayTurnFirstAudioDelayMs: flattenMetric(modeResults, "relayTurnFirstAudioDelayMs"),
        relayTurnHandoffSilenceMs: flattenMetric(modeResults, "relayTurnHandoffSilenceMs"),
        relayTurnResponseResolvedMs: flattenMetric(modeResults, "relayTurnResponseResolvedMs"),
        relayTurnPlaybackFinishedMs: flattenMetric(modeResults, "relayTurnPlaybackFinishedMs"),
      };

      return [
        mode,
        {
          runs: modeResults.length,
          expectedRelayTurns: modeResults.length * Math.max(0, podcastTurnCount - 1),
          measuredRelayTurns: modeResults.reduce(
            (sum, result) => sum + result.metrics.relayTurns.length,
            0,
          ),
          transcriptFallbackTurns: modeResults.reduce(
            (sum, result) => sum + result.metrics.transcriptFallbackTurnIndices.length,
            0,
          ),
          metrics: Object.fromEntries(
            commonMetrics.map((metricName) => [
              metricName,
              summarizeNumericValues(flattened[metricName]),
            ]),
          ),
          proof: {
            preparedInputTurns: modeResults.flatMap(
              (result) => result.metrics.preparedInputTurnIndices,
            ).length,
            preparedOutputTurns: modeResults.flatMap(
              (result) => result.metrics.preparedOutputTurnIndices,
            ).length,
          },
        },
      ];
    }),
  );

  const streamingFirstAudio =
    summaryByMode.streaming.metrics.relayTurnFirstAudioDelayMs.mean;
  const batchFirstAudio =
    summaryByMode.batch.metrics.relayTurnFirstAudioDelayMs.mean;
  const streamingHandoff =
    summaryByMode.streaming.metrics.relayTurnHandoffSilenceMs.mean;
  const batchHandoff =
    summaryByMode.batch.metrics.relayTurnHandoffSilenceMs.mean;

  return {
    ok: true,
    targetUrl,
    topic,
    iterationsPerMode,
    podcastTurnCount,
    relayTurnsPerRun: Math.max(0, podcastTurnCount - 1),
    benchmarkOrder: benchmarkModes,
    summaryByMode,
    improvements: {
      relayTurnFirstAudioDelayMs: buildImprovementSummary(
        streamingFirstAudio,
        batchFirstAudio,
      ),
      relayTurnHandoffSilenceMs: buildImprovementSummary(
        streamingHandoff,
        batchHandoff,
      ),
    },
    rawRuns: results,
  };
}

function flattenMetric(results, metricName) {
  return results.flatMap((result) => result.metrics[metricName]);
}

function buildImprovementSummary(streamingValue, batchValue) {
  if (!Number.isFinite(streamingValue) || !Number.isFinite(batchValue) || batchValue === 0) {
    return null;
  }

  return {
    streamingMeanMs: roundMetric(streamingValue),
    batchMeanMs: roundMetric(batchValue),
    absoluteGainMs: roundMetric(batchValue - streamingValue),
    relativeGainPercent: roundMetric(((batchValue - streamingValue) / batchValue) * 100),
  };
}

function summarizeNumericValues(values) {
  const finiteValues = values.filter((value) => Number.isFinite(value));

  if (finiteValues.length === 0) {
    return {
      mean: null,
      min: null,
      max: null,
      samples: [],
    };
  }

  return {
    mean: roundMetric(finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length),
    min: roundMetric(Math.min(...finiteValues)),
    max: roundMetric(Math.max(...finiteValues)),
    samples: finiteValues.map((value) => roundMetric(value)),
  };
}

function buildBenchmarkModes(iterationsPerMode) {
  const modes = [];
  for (let index = 0; index < iterationsPerMode; index += 1) {
    modes.push("streaming", "batch");
  }
  return modes;
}

function findEvent(events, eventName, predicate = () => true) {
  return events.find((event) => event.eventName === eventName && predicate(event)) ?? null;
}

function diffPerf(laterEvent, earlierEvent) {
  if (!laterEvent || !earlierEvent) {
    return null;
  }

  const later = asFiniteNumber(laterEvent.perfNowMs);
  const earlier = asFiniteNumber(earlierEvent.perfNowMs);
  if (later == null || earlier == null) {
    return null;
  }

  return roundMetric(later - earlier);
}

function asFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function roundMetric(value) {
  return Math.round(value * 10) / 10;
}

async function writeBenchmarkArtifacts({
  artifactDir,
  debugEvents,
  error,
  lastKnownState,
  mode,
  page,
  perModeIndex,
}) {
  await mkdir(artifactDir, { recursive: true });
  const runLabel = `${mode}-${String(perModeIndex).padStart(2, "0")}`;
  await writeFile(
    path.join(artifactDir, `${runLabel}.json`),
    JSON.stringify(
      {
        ok: false,
        mode,
        perModeIndex,
        errorMessage: error instanceof Error ? error.message : String(error),
        lastKnownState,
        debugEvents,
      },
      null,
      2,
    ),
    "utf8",
  );
  await page
    .screenshot({
      path: path.join(artifactDir, `${runLabel}.png`),
      fullPage: true,
    })
    .catch(() => {});
}

async function resolveApiKeyFromDotEnv() {
  try {
    const dotEnv = await readFile(path.join(process.cwd(), ".env"), "utf8");
    const match = dotEnv.match(/^NEXT_PUBLIC_GEMINI_API_KEY=(.*)$/m);
    return match?.[1]?.trim() || "";
  } catch {
    return "";
  }
}
