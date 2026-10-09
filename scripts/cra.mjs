#!/usr/bin/env node
/**
 * Runs react-scripts with GOOGLE_CLIENT_ID exposed to the app.
 *
 * Create React App only inlines variables that start with REACT_APP_, so this wrapper reads GOOGLE_CLIENT_ID
 * (from the shell, .env.local or .env) and passes it on as REACT_APP_GOOGLE_CLIENT_ID.
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

const fromFiles = { ...readEnvFile(".env"), ...readEnvFile(".env.local") };
const clientId = (process.env.GOOGLE_CLIENT_ID || fromFiles.GOOGLE_CLIENT_ID || "").trim();
const env = { ...process.env };
if (clientId && !env.REACT_APP_GOOGLE_CLIENT_ID) env.REACT_APP_GOOGLE_CLIENT_ID = clientId;

const bin = createRequire(import.meta.url).resolve("react-scripts/bin/react-scripts.js");
const child = spawn(process.execPath, [bin, ...process.argv.slice(2)], { stdio: "inherit", env });
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
