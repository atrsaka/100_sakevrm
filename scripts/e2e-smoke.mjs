import { chromium } from "playwright";

const targetUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
const prompt = process.env.E2E_PROMPT || "こんにちは";
const requestTimeoutMs = Number(process.env.E2E_TIMEOUT_MS || 90000);
const startupTimeoutMs = Number(process.env.E2E_STARTUP_TIMEOUT_MS || 60000);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();

const failedRequests = [];
const blockingConsoleErrors = [];
const requestedUrls = [];

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
    "favicon.ico",
    "geminiLiveChat",
  ];

  if (blockingPatterns.some((pattern) => text.includes(pattern))) {
    blockingConsoleErrors.push(text);
  }
});

try {
  await waitForServer(targetUrl, startupTimeoutMs);
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});

  const startButton = page.getByRole("button", { name: /start/i });
  if (await startButton.isVisible().catch(() => false)) {
    await startButton.click();
  }

  await page.locator('input[placeholder="Type a message"]').fill(prompt);
  await page.locator('button[aria-label="Send"]').click();

  await page.waitForFunction(
    () => {
      const text = document.body.textContent || "";
      const rawParams = window.localStorage.getItem("chatVRMParams");
      if (!rawParams) {
        return false;
      }

      const params = JSON.parse(rawParams);
      const chatLog = params.chatLog;

      return (
        Array.isArray(chatLog) &&
        chatLog.length >= 2 &&
        chatLog.at(-1)?.role === "assistant" &&
        !text.includes("Generating response...")
      );
    },
    { timeout: requestTimeoutMs }
  );

  const faviconIcoRequested = requestedUrls.some((url) =>
    url.endsWith("/favicon.ico")
  );

  if (blockingConsoleErrors.length > 0) {
    throw new Error(`Blocking console errors detected:\n${blockingConsoleErrors.join("\n")}`);
  }

  if (
    failedRequests.some(
      (request) =>
        request.url.includes("favicon.ico") ||
        request.url.includes("geminiLiveChat") ||
        request.url.includes("ChunkLoadError")
    )
  ) {
    throw new Error(`Failed requests detected:\n${JSON.stringify(failedRequests, null, 2)}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        targetUrl,
        prompt,
        faviconIcoRequested: Boolean(faviconIcoRequested),
        failedRequests,
      },
      null,
      2
    )
  );
} finally {
  await context.close();
  await browser.close();
}

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.ok || response.status === 304) {
        return;
      }
    } catch {
      // Keep polling until timeout.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    `Dev server was not reachable at ${url} within ${timeoutMs}ms. Start it with "npm run dev -- --hostname 127.0.0.1 --port 3100" and retry.`
  );
}
