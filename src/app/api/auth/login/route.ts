import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/db/supabase-admin-auth";
import { getSessionCookieName, getSessionValue } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  if (!(await verifyAdmin(username, password))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(getSessionCookieName(), getSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(getSessionCookieName(), "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
