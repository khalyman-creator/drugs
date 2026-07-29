import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/db/supabase-admin-auth";
import { createSessionToken, getSessionCookieName, getSessionMaxAgeSeconds } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  if (!(await verifyAdmin(username, password))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(getSessionCookieName(), createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getSessionMaxAgeSeconds(),
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(getSessionCookieName(), "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
