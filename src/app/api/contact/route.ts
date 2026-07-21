import { NextResponse } from "next/server";
import { sendContactMessage } from "@/lib/email/send-contact";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const subject =
      typeof body.subject === "string" && body.subject.trim()
        ? body.subject.trim()
        : "Customer message";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || name.length > 120) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }

    if (!email || !EMAIL_PATTERN.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }

    if (!message || message.length < 10) {
      return NextResponse.json(
        { error: "Please enter a message (at least 10 characters)." },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: "Message is too long." }, { status: 400 });
    }

    if (subject.length > 200) {
      return NextResponse.json({ error: "Subject is too long." }, { status: 400 });
    }

    const result = await sendContactMessage({ name, email, subject, message });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 503 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
