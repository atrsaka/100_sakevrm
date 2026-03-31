import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const targetUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:3100/";
const topic =
  process.env.E2E_PODCAST_TOPIC ||
  "Summarize two notable AI product trends in a short podcast exchange.";
const requestTimeoutMs = Number(process.env.E2E_TIMEOUT_MS || 180000);
const startupTimeoutMs = Number(process.env.E2E_STARTUP_TIMEOUT_MS || 60000);
const defaultPodcastTurnCount = 6;
const rawPodcastTurnCount = Number.parseInt(
  String(process.env.E2E_PODCAST_TURN_COUNT || 2),
  10,
);
const podcastTurnCount = Number.isNaN(rawPodcastTurnCount)
  ? defaultPodcastTurnCount
  : Math.min(Math.max(rawPodcastTurnCount, 2), 12);
const apiKey =
  process.env.E2E_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const allowMissingApiKeySkip =
  String(process.env.E2E_ALLOW_MISSING_API_KEY_SKIP || "true").toLowerCase() !==
  "false";
const artifactDir =
  process.env.E2E_ARTIFACT_DIR || path.join(process.cwd(), ".tmp-e2e-podcast");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();

const failedRequests = [];
const blockingConsoleErrors = [];
const pageErrors = [];
const requestedUrls = [];
let lastKnownState = null;

page.on("request", (request) => {
  requestedUrls.push(request.url());
});

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
  await waitForServer(targetUrl, startupTimeoutMs);
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});

  await ensureExternalControl(page);

  if (apiKey) {
    await setGeminiApiKey(page, apiKey);
  }

  const startButton = page.getByRole("button", { name: /start/i });
  if (await startButton.isVisible().catch(() => false)) {
    await startButton.click();
    await startButton.waitFor({ state: "hidden" }).catch(() => {});
  }

  const initialState = await getExternalControlState(page);
  if (apiKey && !initialState?.hasGeminiApiKey) {
    throw new Error("An E2E Gemini API key was provided, but the app did not accept it.");
  }

  if (!initialState?.hasGeminiApiKey) {
    if (!allowMissingApiKeySkip) {
      throw new Error(
        "Gemini API key is missing. Provide E2E_GEMINI_API_KEY or allow skipping.",
      );
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          targetUrl,
          topic,
          outcome: "skipped-missing-api-key",
        },
        null,
        2,
      ),
    );
    process.exit(0);
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
    (expectedTurns) => {
      const state = window.geminiVrmControl?.getState?.();
      return Boolean(
        state &&
          state.interactionMode === "podcast" &&
          state.chatProcessing === false &&
          Array.isArray(state.podcastLog) &&
          state.podcastLog.length === 0 &&
          state.podcastTurnCount === expectedTurns,
      );
    },
    podcastTurnCount,
    requestTimeoutMs,
    "podcast reset state",
  );

  await page.evaluate(
    async ({ nextTopic }) => {
      await window.geminiVrmControl.sendMessage(nextTopic, "E2E");
    },
    { nextTopic: topic },
  );

  await waitForExternalControlState(
    page,
    (expectedTurns) => {
      const state = window.geminiVrmControl?.getState?.();
      return Boolean(
        state &&
          state.chatProcessing === false &&
          Array.isArray(state.podcastLog) &&
          state.podcastLog.length >= expectedTurns,
      );
    },
    podcastTurnCount,
    requestTimeoutMs,
    `podcast log length >= ${podcastTurnCount}`,
  );

  const finalState = await getExternalControlState(page);
  const speakerNames = finalState.podcastLog.map((entry) => entry.name || "");
  const uniqueSpeakers = [...new Set(speakerNames.filter(Boolean))];

  if (uniqueSpeakers.length < 2) {
    throw new Error(
      `Podcast log did not include both speakers: ${JSON.stringify(speakerNames)}`,
    );
  }

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

  if (finalState.assistantStatus === "Error") {
    throw new Error(
      `Podcast relay ended in Error status: ${finalState.assistantMessage || "unknown"}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        targetUrl,
        topic,
        podcastTurnCount,
        outcome: "podcast-relay-complete",
        podcastLogLength: finalState.podcastLog.length,
        speakers: uniqueSpeakers,
        assistantStatus: finalState.assistantStatus,
      },
      null,
      2,
    ),
  );
} catch (error) {
  const diagnostic = {
    ok: false,
    targetUrl,
    topic,
    podcastTurnCount,
    errorMessage: error instanceof Error ? error.message : String(error),
    blockingConsoleErrors,
    pageErrors,
    failedRequests,
    recentRequests: requestedUrls.slice(-20),
    lastKnownState,
  };

  await writeDiagnosticArtifacts(page, diagnostic);
  throw error;
} finally {
  await context.close();
  await browser.close();
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
  const hasControl = await page
    .evaluate(() => typeof window.geminiVrmControl?.getState === "function")
    .catch(() => false);

  if (hasControl) {
    return;
  }

  await page.evaluate(() => {
    window.localStorage.setItem("geminiVrmExternalControl", "true");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
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
  const state = await page.evaluate(
    () => window.geminiVrmControl?.getState?.() ?? null,
  );
  lastKnownState = state;
  return state;
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

  await getExternalControlState(page).catch(() => null);
}

async function writeDiagnosticArtifacts(page, diagnostic) {
  await mkdir(artifactDir, { recursive: true });
  await writeFile(
    path.join(artifactDir, "podcast-diagnostic.json"),
    JSON.stringify(diagnostic, null, 2),
    "utf8",
  );
  await page
    .screenshot({
      path: path.join(artifactDir, "podcast-failure.png"),
      fullPage: true,
    })
    .catch(() => {});
}
