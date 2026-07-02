import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, items, payment_method } = body;

    if (!customer?.name || !customer?.email || !customer?.address || !customer?.city || !customer?.zip) {
      return NextResponse.json({ error: "All shipping fields are required" }, { status: 400 });
    }

    if (!items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const result = createOrder(customer, items, payment_method ?? "standard");
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
