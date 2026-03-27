import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";

const appHost = process.env.GEMINI_APP_HOST || "127.0.0.1";
const appPort = process.env.GEMINI_APP_PORT || "3100";
const docsHost = process.env.GEMINI_DOCS_HOST || "127.0.0.1";
const docsPort = process.env.GEMINI_DOCS_PORT || "4173";

const children = [];
let shuttingDown = false;
let exitCode = 0;
const appEnv = {
  ...process.env,
  NEXT_PUBLIC_DOCS_URL: `${getProtocol()}//${docsHost}:${docsPort}/`,
};

startService(
  "app",
  process.execPath,
  [resolveLocalBin("next"), "dev", "--hostname", appHost, "--port", appPort],
  { name: "Next app", color: "\u001b[34m", env: appEnv }
);

startService(
  "docs",
  process.execPath,
  [resolveLocalBin("vitepress"), "dev", "docs", "--host", docsHost, "--port", docsPort],
  { name: "VitePress docs", color: "\u001b[32m", env: process.env }
);

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

function startService(label, command, args, labelInfo) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: labelInfo.env,
  });

  children.push({ label, child });

  child.on("error", (error) => {
    console.error(`[${label}] failed to start: ${error.message}`);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      maybeExit();
      return;
    }

    if (code === 0) {
      console.log(`${labelInfo.color}${labelInfo.name}\u001b[0m exited normally.`);
    } else {
      console.error(
        `${labelInfo.color}${labelInfo.name}\u001b[0m exited with code ${code}${
          signal ? ` (signal: ${signal})` : ""
        }.`
      );
    }

    shutdown(code ?? 1);
  });
}

function shutdown(code) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  exitCode = code ?? 1;

  for (const childEntry of children) {
    if (!childEntry.child.killed) {
      childEntry.child.kill("SIGINT");
    }
  }

  setTimeout(() => {
    for (const childEntry of children) {
      if (!childEntry.child.killed) {
        forceTerminate(childEntry.child.pid);
      }
    }
    maybeExit(true);
  }, 3000).unref();
}

function maybeExit(force = false) {
  if (!shuttingDown) {
    return;
  }

  const hasRunningChildren = children.some(
    ({ child }) => child.exitCode === null && child.signalCode === null
  );

  if (!hasRunningChildren || force) {
    process.exit(exitCode);
  }
}

function forceTerminate(pid) {
  if (!pid) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }

  process.kill(pid, "SIGKILL");
}

function getProtocol() {
  return process.env.GEMINI_DOCS_PROTOCOL || "http:";
}

function resolveLocalBin(name) {
  switch (name) {
    case "next":
      return resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");
    case "vitepress":
      return resolve(
        process.cwd(),
        "node_modules",
        "vitepress",
        "dist",
        "node",
        "cli.js"
      );
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
