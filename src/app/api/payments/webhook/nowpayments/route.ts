import { NextResponse } from "next/server";
import {
  handlePaidWebhook,
  markOrderFailed,
} from "@/lib/checkout/service";
import { getOrderById } from "@/lib/db/supabase-orders";
import { handlePaymentWebhook } from "@/lib/payments";

// Payment-row status/metadata (paid_at, invoice_id, etc.) is already written
// by handlePaymentWebhook/handleProviderWebhook — this route only needs to
// drive the order-level transition, which lives in a separate table.
export async function POST(req: Request) {
  const rawBody = await req.text();

  if (!rawBody) {
    return NextResponse.json({ error: "Empty payload" }, { status: 400 });
  }

  try {
    const result = await handlePaymentWebhook(rawBody, req.headers);

    if (!result) {
      return NextResponse.json({ error: "Invalid webhook" }, { status: 401 });
    }

    const order = await getOrderById(result.orderId);

    if (result.status === "paid") {
      if (order?.status === "paid" || result.duplicate) {
        return NextResponse.json({ success: true, duplicate: true });
      }

      await handlePaidWebhook(result.orderId);
    } else if (result.status === "failed" && order?.status !== "paid") {
      await markOrderFailed(result.orderId);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
