import { NextRequest, NextResponse } from "next/server";
import { updateAdminPassword, verifyAdminPassword } from "@/lib/db/supabase-admin-auth";
import { isAdminLoggedIn } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return NextResponse.json({ error: "Current and new password required" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }
  if (!(await verifyAdminPassword(currentPassword))) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  await updateAdminPassword(newPassword);
  return NextResponse.json({ success: true });
}
