import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Keeps a fire-and-forget promise (a non-critical notification email, etc.)
 * alive past the point the HTTP response is sent. Cloudflare Workers can
 * tear down the isolate as soon as the response returns, silently killing
 * any promise that isn't registered with the platform's waitUntil — this is
 * why un-awaited admin notification emails were never reaching Resend at
 * all, not even as a failed attempt. No-ops outside the Workers runtime
 * (e.g. plain `next dev`), where the process stays alive on its own.
 */
export function keepAlive(promise: Promise<unknown>): void {
  try {
    const { ctx } = getCloudflareContext();
    ctx.waitUntil(promise);
  } catch {
    // Not running under the Workers runtime — nothing tears the process
    // down early, so the promise still runs to completion on its own.
  }
}
