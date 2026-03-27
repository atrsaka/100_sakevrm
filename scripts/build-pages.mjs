import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const nextBuildDir = resolve(projectRoot, ".next");
const nextExportDir = resolve(projectRoot, "out");
const docsDistDir = resolve(projectRoot, "docs", ".vitepress", "dist");
const pagesDistDir = resolve(projectRoot, ".next-pages");
const pagesDocsDir = resolve(pagesDistDir, "docs");

process.env.NEXT_EXPORT = process.env.NEXT_EXPORT || "true";

cleanPagesBuildOutputs();
runCommand(process.execPath, [resolveLocalBin("next"), "build"]);
runCommand(process.execPath, [resolveLocalBin("vitepress"), "build", "docs"]);
copyAppToPages();
copyDocsToPages();

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `Command failed: ${command} ${args.join(" ")} (exit ${result.status})`
    );
  }
}

function resolveLocalBin(name) {
  switch (name) {
    case "next":
      return resolve(projectRoot, "node_modules", "next", "dist", "bin", "next");
    case "vitepress":
      return resolve(
        projectRoot,
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

function cleanPagesBuildOutputs() {
  rmSync(nextBuildDir, { recursive: true, force: true });
  rmSync(nextExportDir, { recursive: true, force: true });
  rmSync(pagesDistDir, { recursive: true, force: true });
}

function copyAppToPages() {
  if (!existsSync(nextExportDir)) {
    throw new Error(`Next export output not found: ${nextExportDir}`);
  }

  rmSync(pagesDistDir, { recursive: true, force: true });
  cpSync(nextExportDir, pagesDistDir, { recursive: true });
  console.log(`Copied Next export to ${pagesDistDir}`);
}

function copyDocsToPages() {
  if (!existsSync(docsDistDir)) {
    throw new Error(`VitePress output not found: ${docsDistDir}`);
  }

  rmSync(pagesDocsDir, { recursive: true, force: true });
  cpSync(docsDistDir, pagesDocsDir, { recursive: true });
  console.log(`Copied VitePress docs to ${pagesDocsDir}`);

  if (!existsSync(resolve(pagesDocsDir, "index.html"))) {
    throw new Error("Pages docs entrypoint not found: .next-pages/docs/index.html");
  }
}
