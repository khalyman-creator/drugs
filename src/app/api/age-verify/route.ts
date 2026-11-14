import { NextResponse } from "next/server";
import {
  AGE_COOKIE,
  AGE_COOKIE_MAX_AGE_SECONDS,
  AGE_COOKIE_VALUE,
} from "@/lib/age-gate";

/**
 * Records that a visitor confirmed they meet the minimum age.
 *
 * The cookie is httpOnly because only the server needs to read it — the
 * storefront layout checks it before rendering any product content. That also
 * means it cannot be set from the console without going through this route.
 */
export async function POST() {
  const res = NextResponse.json({ verified: true });
  res.cookies.set(AGE_COOKIE, AGE_COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AGE_COOKIE_MAX_AGE_SECONDS,
  });
  return res;
}

/** Clears the confirmation — used by the "not old enough" path and for testing. */
export async function DELETE() {
  const res = NextResponse.json({ verified: false });
  res.cookies.set(AGE_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
