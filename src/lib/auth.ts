import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseServiceRoleKey } from "@/lib/env";

const SESSION_COOKIE = "shop_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function sign(payload: string): string {
  return createHmac("sha256", getSupabaseServiceRoleKey()).update(payload).digest("hex");
}

/** Signed, expiring session token — not a static shared secret, can't be forged without the server key. */
export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `admin.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function verifySessionToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [marker, expiresAtStr, signature] = parts;
  if (marker !== "admin") return false;

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const payload = `${marker}.${expiresAtStr}`;
  const expected = sign(payload);

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}

export async function isAdminLoggedIn(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

export function getSessionMaxAgeSeconds(): number {
  return SESSION_MAX_AGE_SECONDS;
}
