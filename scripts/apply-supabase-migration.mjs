/**
 * Apply RawDrop schema to Supabase project jtapjomhwtfmobleoyov via Management API.
 * Requires: SUPABASE_ACCESS_TOKEN (dashboard → Account → Access Tokens)
 *
 *   set SUPABASE_ACCESS_TOKEN=sbp_...
 *   node scripts/apply-supabase-migration.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = "jtapjomhwtfmobleoyov";
const MIGRATION = path.join(__dirname, "..", "supabase", "migrations", "001_initial_schema.sql");
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error("Set SUPABASE_ACCESS_TOKEN first (https://supabase.com/dashboard/account/tokens)");
  process.exit(1);
}

async function api(method, urlPath, body) {
  const res = await fetch(`https://api.supabase.com/v1${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${urlPath} (${res.status}): ${text}`);
  return text ? JSON.parse(text) : null;
}

async function main() {
  const sql = fs.readFileSync(MIGRATION, "utf8");
  console.log(`Applying migration to ${PROJECT_REF}...`);
  await api("POST", `/projects/${PROJECT_REF}/database/query`, { query: sql });
  console.log("Migration applied.");

  const keys = await api("GET", `/projects/${PROJECT_REF}/api-keys?reveal=true`);
  const service = keys.find((k) => k.name === "service_role")?.api_key;
  const anon =
    keys.find((k) => k.name === "anon")?.api_key ??
    keys.find((k) => k.name === "publishable")?.api_key;

  const out = {
    NEXT_PUBLIC_SUPABASE_URL: `https://${PROJECT_REF}.supabase.co`,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      "sb_publishable_myCoMj84SDPKxIMIcQd1-Q_bEEj_3tr",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
    SUPABASE_SERVICE_ROLE_KEY: service,
  };

  const outPath = path.join(__dirname, "..", ".rawdrop-supabase.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Saved ${outPath}`);

  if (service && process.env.AUTO_CLOUDFLARE === "1") {
    const { spawnSync } = await import("node:child_process");
    spawnSync(
      "npx",
      ["wrangler", "secret", "put", "SUPABASE_SERVICE_ROLE_KEY", "--name", "drugs"],
      { input: service, stdio: ["pipe", "inherit", "inherit"], shell: true }
    );
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
