import { NextResponse } from "next/server";
import {
  handlePaidWebhook,
  markOrderFailed,
} from "@/lib/checkout/service";
import { findPaymentByOrderId, updatePaymentRecord } from "@/lib/db/supabase-payments";
import { getOrderById } from "@/lib/db/supabase-orders";
import { handlePaymentWebhook } from "@/lib/payments";

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

      const payment = await findPaymentByOrderId(result.orderId);
      if (payment) {
        await updatePaymentRecord(payment.id, {
          status: "paid",
          provider_payment_id:
            result.providerPaymentId ?? payment.provider_payment_id,
          metadata: {
            ...(payment.metadata ?? {}),
            paid_at: new Date().toISOString(),
            payment_method: "nowpayments",
            invoice_id:
              result.providerPaymentId ?? payment.provider_payment_id,
          },
        });
      }

      await handlePaidWebhook(result.orderId);
    } else if (result.status === "failed") {
      const payment = await findPaymentByOrderId(result.orderId);
      if (payment && payment.status !== "paid") {
        await updatePaymentRecord(payment.id, { status: "failed" });
      }
      if (order?.status !== "paid") {
        await markOrderFailed(result.orderId);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
