import { readFile } from "node:fs/promises";
import path from "node:path";

const topicFilePath = process.argv[2];

if (!topicFilePath) {
  throw new Error("Usage: node scripts/run-podcast-topic-benchmark.mjs <topic-file>");
}

process.env.E2E_PODCAST_BENCH_TOPIC = (
  await readFile(path.resolve(topicFilePath), "utf8")
).trim();

await import("./benchmark-podcast-relay.mjs");
