import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
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
const liveModel =
  process.env.E2E_GEMINI_MODEL || "gemini-2.5-flash-native-audio-latest";
const requestTimeoutMs = Number(process.env.E2E_TIMEOUT_MS || 480000);
const startupTimeoutMs = Number(process.env.E2E_STARTUP_TIMEOUT_MS || 60000);
const setupTimeoutMs = Number(process.env.E2E_SETUP_TIMEOUT_MS || 120000);
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
const configuredArtifactDir =
  process.env.E2E_BENCH_ARTIFACT_DIR ||
  process.env.E2E_BENCH_OUTPUT_DIR ||
  path.join(os.tmpdir(), "gemini-vrm-benchmark-podcast-relay");
const artifactDir = path.resolve(configuredArtifactDir);
const explicitBenchmarkModes = String(process.env.E2E_BENCH_MODES || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter((value) => value === "streaming" || value === "batch");
const benchmarkModes =
  explicitBenchmarkModes.length > 0
    ? explicitBenchmarkModes
    : buildBenchmarkModes(iterationsPerMode);

if (!apiKey) {
  throw new Error(
    "Podcast relay benchmark requires E2E_GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY.",
  );
}

assertSafeArtifactDir(artifactDir, targetUrl);

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
      setupTimeoutMs,
      targetUrl,
      topic,
    });
    results.push(result);
    await writeSuccessfulRunArtifact({
      artifactDir,
      mode,
      perModeIndex,
      result,
    });
  }

  const summary = summarizeBenchmarkResults({
    artifactDir,
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
    setupTimeoutMs,
    targetUrl,
    topic,
  },
) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(setupTimeoutMs);
  page.setDefaultNavigationTimeout(setupTimeoutMs);
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
    await configureBenchmarkFlags(page, targetUrl, mode);
    await ensureExternalControl(page, setupTimeoutMs);
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

async function configureBenchmarkFlags(page, targetUrl, mode) {
  await page.addInitScript(({ nextMode, nextModel }) => {
    const rawParams = window.localStorage.getItem("chatVRMParams");
    let params = {};
    if (rawParams) {
      try {
        params = JSON.parse(rawParams);
      } catch {
        params = {};
      }
    }

    window.localStorage.setItem("geminiVrmExternalControl", "true");
    window.localStorage.setItem("podcastDebug", "true");
    window.localStorage.setItem("podcastRelayMode", nextMode);
    window.localStorage.setItem(
      "chatVRMParams",
      JSON.stringify({
        ...params,
        geminiModel: nextModel,
        chatLog: [],
        podcastLog: [],
        interactionMode: "chat",
      }),
    );
  }, { nextMode: mode, nextModel: liveModel });
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: setupTimeoutMs });
  await page.waitForLoadState("networkidle").catch(() => {});
  let lastError;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.evaluate(({ nextMode, nextModel }) => {
        const rawParams = window.localStorage.getItem("chatVRMParams");
        let params = {};
        if (rawParams) {
          try {
            params = JSON.parse(rawParams);
          } catch {
            params = {};
          }
        }

        window.localStorage.setItem("geminiVrmExternalControl", "true");
        window.localStorage.setItem("podcastDebug", "true");
        window.localStorage.setItem("podcastRelayMode", nextMode);
        window.localStorage.setItem(
          "chatVRMParams",
          JSON.stringify({
            ...params,
            geminiModel: nextModel,
            chatLog: [],
            podcastLog: [],
            interactionMode: "chat",
          }),
        );
      }, { nextMode: mode, nextModel: liveModel });
      lastError = undefined;
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("Execution context was destroyed")) {
        throw error;
      }

      lastError = error;
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await page.waitForTimeout(500);
    }
  }

  if (lastError) {
    throw lastError;
  }

  await page.reload({ waitUntil: "domcontentloaded", timeout: setupTimeoutMs });
  await page.waitForLoadState("networkidle").catch(() => {});
}

async function setGeminiApiKey(page, key) {
  const keyInput = page
    .locator("#intro-gemini-api-key, #settings-gemini-api-key")
    .first();

  await keyInput.waitFor({ state: "attached", timeout: setupTimeoutMs });
  await keyInput.fill(key, { timeout: setupTimeoutMs });
  await keyInput.blur().catch(() => {});
  await waitForExternalControlState(
    page,
    () => Boolean(window.geminiVrmControl?.getState?.()?.hasGeminiApiKey),
    undefined,
    setupTimeoutMs,
    "Gemini API key acceptance",
  );
}

async function ensureExternalControl(page, timeoutMs = setupTimeoutMs) {
  await page.waitForFunction(
    () =>
      typeof window.geminiVrmControl?.getState === "function" &&
      typeof window.geminiVrmControl?.setInteractionMode === "function" &&
      typeof window.geminiVrmControl?.updatePodcastSettings === "function" &&
      typeof window.geminiVrmControl?.sendMessage === "function" &&
      typeof window.geminiVrmControl?.resetConversation === "function",
    { timeout: timeoutMs },
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
  artifactDir,
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
    artifactDir,
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

function assertSafeArtifactDir(resolvedArtifactDir, url) {
  if (process.env.E2E_ALLOW_WORKSPACE_ARTIFACTS === "true") {
    return;
  }

  if (!isLoopbackTarget(url)) {
    return;
  }

  const workspaceDir = path.resolve(process.cwd());
  const normalizedArtifactDir = resolvedArtifactDir.toLowerCase();
  const normalizedWorkspaceDir = workspaceDir.toLowerCase();
  const workspacePrefix = `${normalizedWorkspaceDir}${path.sep}`;

  if (
    normalizedArtifactDir === normalizedWorkspaceDir ||
    normalizedArtifactDir.startsWith(workspacePrefix)
  ) {
    throw new Error(
      [
        "Refusing to write benchmark artifacts inside the repository while targeting a local dev server.",
        "This can trigger Next.js Fast Refresh and invalidate Playwright runs.",
        "Set E2E_BENCH_OUTPUT_DIR to a directory outside the repo, or set E2E_ALLOW_WORKSPACE_ARTIFACTS=true to override this safeguard.",
      ].join(" "),
    );
  }
}

function isLoopbackTarget(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  } catch {
    return false;
  }
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

async function writeSuccessfulRunArtifact({
  artifactDir,
  mode,
  perModeIndex,
  result,
}) {
  await mkdir(artifactDir, { recursive: true });
  const runLabel = `${mode}-${String(perModeIndex).padStart(2, "0")}`;
  await writeFile(
    path.join(artifactDir, `${runLabel}.json`),
    JSON.stringify(
      {
        ok: true,
        mode,
        perModeIndex,
        result,
      },
      null,
      2,
    ),
    "utf8",
  );
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
