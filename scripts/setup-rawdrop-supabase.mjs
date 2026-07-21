/**
 * Creates a RawDrop Supabase project and applies migrations.
 *
 * Prerequisites:
 *   supabase login
 *   OR set SUPABASE_ACCESS_TOKEN
 *
 * Usage:
 *   node scripts/setup-rawdrop-supabase.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MIGRATION = path.join(ROOT, "supabase", "migrations", "001_initial_schema.sql");
const API = "https://api.supabase.com/v1";

const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN. Run: npx supabase login\nThen retry, or export SUPABASE_ACCESS_TOKEN."
  );
  process.exit(1);
}

async function api(method, urlPath, body) {
  const res = await fetch(`${API}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(`${method} ${urlPath} failed (${res.status}): ${text}`);
  }

  return data;
}

async function waitForHealthy(projectRef, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      const health = await api("GET", `/projects/${projectRef}/health`);
      const db = Array.isArray(health)
        ? health.find((h) => h.name === "database")
        : null;
      if (db?.status === "ACTIVE_HEALTHY") return;
    } catch {
      // project still provisioning
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
  throw new Error("Timed out waiting for Supabase project to become healthy");
}

async function runSql(projectRef, sql) {
  return api("POST", `/projects/${projectRef}/database/query`, { query: sql });
}

async function main() {
  const orgs = await api("GET", "/organizations");
  if (!orgs?.length) throw new Error("No Supabase organizations found");

  const org = orgs[0];
  console.log(`Using organization: ${org.name} (${org.id})`);

  const dbPassword = crypto.randomUUID().replace(/-/g, "") + "Aa1!";
  const project = await api("POST", "/projects", {
    organization_id: org.id,
    name: "rawdrop",
    region: "us-east-1",
    db_pass: dbPassword,
  });

  const ref = project.ref ?? project.id;
  console.log(`Created project rawdrop: ${ref}`);
  console.log("Waiting for database (this can take a few minutes)...");

  await waitForHealthy(ref);

  const details = await api("GET", `/projects/${ref}`);
  const sql = fs.readFileSync(MIGRATION, "utf8");
  await runSql(ref, sql);
  console.log("Migration applied.");

  const keys = await api("GET", `/projects/${ref}/api-keys?reveal=true`);
  const anon = keys.find((k) => k.name === "anon")?.api_key;
  const service = keys.find((k) => k.name === "service_role")?.api_key;

  const out = {
    NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
    SUPABASE_SERVICE_ROLE_KEY: service,
    projectRef: ref,
    dbPassword,
  };

  const outPath = path.join(ROOT, ".rawdrop-supabase.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`\nSaved keys to ${outPath} (gitignored).`);
  console.log("\nAdd to wrangler vars / secrets:");
  console.log(`NEXT_PUBLIC_SUPABASE_URL=${out.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${out.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);
  console.log("SUPABASE_SERVICE_ROLE_KEY=(see .rawdrop-supabase.json)");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
