#!/usr/bin/env node
/**
 * Post-deploy smoke check for the deployed Cloudflare Worker.
 *
 * Why this exists: a Worker can deploy "successfully" and still throw on every
 * request. That happened on 2026-11-13 — the Next 16 upgrade built cleanly, the
 * deploy went green, and the live site served HTTP 500 (Cloudflare 1101) because
 * the OpenNext adapter did not recognise a manifest Next 16.4 asks for. Nothing
 * in `next build` or `opennextjs-cloudflare build` can catch that, because the
 * failure is at Worker runtime.
 *
 * So after deploying we actually ask the site for a few pages and fail the job
 * loudly if it is not alive.
 *
 * Usage:
 *   node scripts/smoke-check.mjs [baseUrl]
 *
 * Falls back to $NEXT_PUBLIC_SITE_URL. Exits 0 when healthy, 1 when not,
 * 2 on bad usage. Every request is a plain read — nothing here mutates data.
 */

const base = (process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");

if (!base) {
  console.error("smoke-check: no base URL. Pass one as an argument or set NEXT_PUBLIC_SITE_URL.");
  process.exit(2);
}

const ATTEMPTS = Number(process.env.SMOKE_ATTEMPTS ?? 6);
const DELAY_MS = Number(process.env.SMOKE_DELAY_MS ?? 10_000);
const TIMEOUT_MS = 20_000;

/**
 * Each check is deliberately a safe GET on a public route. `/admin` is included
 * because its redirect proves the auth guard still runs — a Worker that 200s the
 * admin page would be worse than one that is down.
 */
/**
 * The storefront is age-gated, so the shop checks have to carry the
 * confirmation cookie. Without it they would follow the redirect and quietly
 * end up asserting against the gate instead of the shop.
 */
const AGE_COOKIE = "silk_age_verified=1";

const checks = [
  // Unverified: proves the gate is actually in force, not just present.
  { label: "age gate", path: "/", redirectTo: "/age-check" },
  { label: "storefront", path: "/", expect: 200, mustContain: "SilkFreedom", cookie: AGE_COOKIE },
  { label: "catalog", path: "/products", expect: 200, cookie: AGE_COOKIE },
  { label: "admin login", path: "/admin/login", expect: 200 },
  { label: "admin auth guard", path: "/admin", redirectTo: "/admin/login" },
  { label: "store config", path: "/api/public/store-config", expect: 200, json: true },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runCheck(check) {
  const url = `${base}${check.path}`;
  let res;

  // Explicit controller rather than AbortSignal.timeout(), so the timer is
  // always cleared and no handle is left pending when the script finishes.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    res = await fetch(url, {
      redirect: check.redirectTo ? "manual" : "follow",
      cache: "no-store",
      signal: controller.signal,
      // Generic client name on purpose: no project or personal details leave here.
      headers: {
        "user-agent": "deploy-smoke-check",
        ...(check.cookie ? { cookie: check.cookie } : {}),
      },
    });
  } catch (error) {
    return { ok: false, detail: `request failed: ${error instanceof Error ? error.message : error}` };
  } finally {
    clearTimeout(timer);
  }

  if (check.redirectTo) {
    if (res.status < 300 || res.status > 399) {
      return { ok: false, detail: `expected a redirect, got HTTP ${res.status}` };
    }
    const location = res.headers.get("location") ?? "";
    if (!location.includes(check.redirectTo)) {
      return { ok: false, detail: `redirected to "${location}", expected it to include "${check.redirectTo}"` };
    }
    return { ok: true, detail: `HTTP ${res.status} -> ${location}` };
  }

  if (res.status !== check.expect) {
    return { ok: false, detail: `expected HTTP ${check.expect}, got ${res.status}` };
  }

  const body = await res.text();

  if (check.mustContain && !body.includes(check.mustContain)) {
    // A Worker can return 200 with an error shell, so status alone is not enough.
    return { ok: false, detail: `HTTP 200 but body is missing "${check.mustContain}"` };
  }

  if (check.json) {
    try {
      const parsed = JSON.parse(body);
      return { ok: true, detail: `HTTP ${res.status} ${JSON.stringify(parsed)}` };
    } catch {
      return { ok: false, detail: `HTTP 200 but body is not valid JSON` };
    }
  }

  return { ok: true, detail: `HTTP ${res.status}` };
}

async function runAll() {
  const results = [];
  for (const check of checks) {
    results.push({ check, ...(await runCheck(check)) });
  }
  return results;
}

async function main() {
  console.log(`smoke-check: ${base}`);

  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    const results = await runAll();
    const failed = results.filter((r) => !r.ok);

    if (failed.length === 0) {
      for (const r of results) console.log(`  PASS  ${r.check.label.padEnd(18)} ${r.detail}`);
      console.log("smoke-check: deployment is serving traffic.");
      return 0;
    }

    if (attempt < ATTEMPTS) {
      // A fresh deployment can take a moment to propagate, so one bad round is
      // not yet a broken deploy.
      console.log(
        `  attempt ${attempt}/${ATTEMPTS}: ${failed.length} check(s) not ready ` +
          `(${failed.map((r) => r.check.label).join(", ")}), retrying in ${DELAY_MS / 1000}s`
      );
      await sleep(DELAY_MS);
      continue;
    }

    console.error(`\nsmoke-check: FAILED after ${ATTEMPTS} attempt(s).\n`);
    for (const r of results) {
      console.error(`  ${r.ok ? "PASS" : "FAIL"}  ${r.check.label.padEnd(18)} ${r.check.path}  ${r.detail}`);
    }
    console.error("\nThe deploy completed but the Worker is not serving correctly.");
    console.error("Roll back in the Cloudflare dashboard (Workers > drugs > Deployments) or with `wrangler rollback`.");
    return 1;
  }

  return 1;
}

/*
 * Set exitCode and let the process unwind instead of calling process.exit():
 * an abrupt exit while handles are still closing can trip a libuv assertion on
 * Windows and report 127, which would make a legitimately failed check look
 * like a crashed script in CI.
 */
process.exitCode = await main();
