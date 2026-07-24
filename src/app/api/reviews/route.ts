import { NextResponse } from "next/server";
import { createReview } from "@/lib/db/supabase-reviews";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";

    if (!name || name.length > 80) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }

    if (!comment || comment.length < 5) {
      return NextResponse.json(
        { error: "Please enter a review (at least 5 characters)." },
        { status: 400 }
      );
    }

    if (comment.length > 1000) {
      return NextResponse.json({ error: "Review is too long." }, { status: 400 });
    }

    await createReview({ name, comment });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
