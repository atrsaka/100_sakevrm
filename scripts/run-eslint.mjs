import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const eslintCommand = process.execPath;
const eslintArgs = [
  path.join(process.cwd(), "node_modules", "eslint", "bin", "eslint.js"),
  ".",
  "--config",
  "eslint.config.mjs",
];

const result = spawnSync(eslintCommand, eslintArgs, {
  stdio: "inherit",
  env: {
    ...process.env,
    ESLINT_USE_FLAT_CONFIG: "true",
  },
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
