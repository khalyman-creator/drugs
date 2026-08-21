import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/db/supabase-admin-auth";
import { createSessionToken, getSessionCookieName, getSessionMaxAgeSeconds } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  if (!(await verifyAdminPassword(password))) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
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
