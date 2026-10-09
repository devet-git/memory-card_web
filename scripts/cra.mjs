#!/usr/bin/env node
/**
 * Runs react-scripts with GOOGLE_CLIENT_ID exposed to the app.
 *
 * Create React App only inlines variables that start with REACT_APP_, so this wrapper reads each setting
 * (from the shell, .env.local or .env) and passes it on as REACT_APP_<name>.
 *
 *   node scripts/cra.mjs start|build
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const readEnvFile = (file) => {
  const out = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || m[1].startsWith("#")) continue;
    out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return out;
};

// Build-time settings: written without the prefix, passed on to the app (which reads them as REACT_APP_<name>).
// Only public values belong here: everything exposed ends up in the browser bundle.
const EXPOSED = ["GOOGLE_CLIENT_ID"];

const fromFiles = { ...readEnvFile(".env"), ...readEnvFile(".env.local") };
const env = { ...process.env };
for (const name of EXPOSED) {
  const value = (process.env[name] || fromFiles[name] || "").trim();
  if (value && !env[`REACT_APP_${name}`]) env[`REACT_APP_${name}`] = value;
}
// Do not publish source maps with the production build
if (process.argv[2] === "build" && env.GENERATE_SOURCEMAP === undefined) env.GENERATE_SOURCEMAP = "false";

const bin = createRequire(import.meta.url).resolve("react-scripts/bin/react-scripts.js");
const child = spawn(process.execPath, [bin, ...process.argv.slice(2)], { stdio: "inherit", env });
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
