import { NextRequest, NextResponse } from "next/server";
import { getAllSections, updateSection } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET() {
  return NextResponse.json(getAllSections());
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.id || !body.name) {
    return NextResponse.json({ error: "id and name required" }, { status: 400 });
  }

  const updated = updateSection(body.id, { name: body.name });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
