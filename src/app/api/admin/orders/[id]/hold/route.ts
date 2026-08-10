import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/db/supabase-orders";
import { getShipmentByOrderId, releaseShipmentHold, setShipmentHold } from "@/lib/db/supabase-shipments";
import { recordOrderStatusEvent } from "@/lib/db/supabase-order-events";
import { notifyCustomerOfStatusEvent } from "@/lib/email/send-order-emails";
import { HOLD_REASONS, type HoldReason } from "@/lib/shipping-status";
import { isAdminLoggedIn } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  if (body.action === "place") {
    const reason = body.reason as HoldReason;
    if (!HOLD_REASONS.includes(reason)) {
      return NextResponse.json({ error: "Invalid hold reason" }, { status: 400 });
    }

    const customerMessage =
      typeof body.customer_message === "string" ? body.customer_message.trim() || undefined : undefined;
    const internalNote =
      typeof body.internal_note === "string" ? body.internal_note.trim() || undefined : undefined;

    const updated = await setShipmentHold(id, { reason, customerMessage, internalNote });

    const event = await recordOrderStatusEvent({
      orderId: id,
      eventType: "hold_placed",
      newValue: reason,
      reason: internalNote ?? null,
      customerMessage: customerMessage ?? null,
    });
    notifyCustomerOfStatusEvent(event.id).catch((err) => {
      console.error("[admin/orders/hold] Notification email failed:", err);
    });

    return NextResponse.json(updated);
  }

  if (body.action === "release") {
    const shipment = await getShipmentByOrderId(id);
    const updated = await releaseShipmentHold(id);

    await recordOrderStatusEvent({
      orderId: id,
      eventType: "hold_released",
      previousValue: shipment?.hold_reason ?? null,
    });
    // No customer email for hold-released (confirmed default).

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "action must be 'place' or 'release'" }, { status: 400 });
}
