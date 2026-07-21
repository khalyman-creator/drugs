import { NextRequest, NextResponse } from "next/server";
import { getSiteSettings, updateSiteSettings } from "@/lib/db/supabase-settings";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET() {
  return NextResponse.json(await getSiteSettings());
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const updated = await updateSiteSettings(body);
  return NextResponse.json(updated);
}
