/**
 * Wire payment gateway: test Supabase + NOWPayments, apply migration if possible.
 * Run: node scripts/setup-payment-gateway.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadDevVars() {
  const file = path.join(root, ".dev.vars");
  if (!fs.existsSync(file)) throw new Error("Missing .dev.vars");
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    env[trimmed.slice(0, i)] = trimmed.slice(i + 1);
  }
  return env;
}

async function testSupabase(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase URL or service role key missing in .dev.vars");

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("customers").select("id").limit(1);
  if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
    return { ok: false, needsMigration: true, error: error.message };
  }
  if (error) return { ok: false, needsMigration: false, error: error.message };
  return { ok: true, needsMigration: false };
}

async function testNowPayments(env) {
  const apiKey = env.NOWPAYMENTS_API_KEY;
  if (!apiKey) throw new Error("NOWPAYMENTS_API_KEY missing in .dev.vars");

  const res = await fetch("https://api.nowpayments.io/v1/status", {
    headers: { "x-api-key": apiKey },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, error: data?.message ?? `HTTP ${res.status}` };
  }
  return { ok: true, message: data?.message ?? "API reachable" };
}

async function main() {
  const env = loadDevVars();
  console.log("Testing Supabase...");
  const supabase = await testSupabase(env);
  if (supabase.ok) {
    console.log("  OK — customers table exists");
  } else if (supabase.needsMigration) {
    console.log("  NEEDS MIGRATION — run SQL in dashboard:");
    console.log("  https://supabase.com/dashboard/project/jtapjomhwtfmobleoyov/sql/new");
    console.log("  File: supabase/migrations/001_initial_schema.sql");
  } else {
    console.log("  ERROR:", supabase.error);
  }

  console.log("\nTesting NOWPayments API...");
  const np = await testNowPayments(env);
  if (np.ok) {
    console.log("  OK —", np.message);
  } else {
    console.log("  ERROR:", np.error);
  }

  const ipn = env.NOWPAYMENTS_IPN_SECRET;
  console.log("\nIPN webhook secret:", ipn ? "set" : "NOT SET — add NOWPAYMENTS_IPN_SECRET to .dev.vars after generating in NOWPayments → Settings → IPN");

  const checkoutReady =
    supabase.ok && np.ok;
  console.log("\ncheckoutReady (local):", checkoutReady);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
