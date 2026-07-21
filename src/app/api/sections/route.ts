import { NextRequest, NextResponse } from "next/server";
import { getAllSections, updateSection, createSection, deleteSection } from "@/lib/db/supabase-sections";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET() {
  return NextResponse.json(await getAllSections());
}

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.name || !String(body.name).trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const section = await createSection(String(body.name).trim());
  return NextResponse.json(section, { status: 201 });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.id || !body.name) {
    return NextResponse.json({ error: "id and name required" }, { status: 400 });
  }

  const updated = await updateSection(body.id, { name: body.name });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const result = await deleteSection(Number(body.id));
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });
  return NextResponse.json({ ok: true });
}
