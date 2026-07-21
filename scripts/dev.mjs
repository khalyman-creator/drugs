/**
 * Start Next.js dev with .dev.vars loaded (same secrets as Cloudflare local).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const devVarsPath = path.join(root, ".dev.vars");

function loadDevVars() {
  if (!fs.existsSync(devVarsPath)) {
    console.warn("Warning: .dev.vars not found — checkout/payments may not work locally.");
    return;
  }

  for (const line of fs.readFileSync(devVarsPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 1) continue;
    const key = trimmed.slice(0, i);
    const value = trimmed.slice(i + 1);
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  // Local dev: use localhost for redirects unless explicitly overridden
  if (!process.env.FORCE_PRODUCTION_SITE_URL) {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
  }
}

loadDevVars();

const child = spawn("next", ["dev", "-p", "3000"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
