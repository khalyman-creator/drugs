import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrderShippingStatus } from "@/lib/db/supabase-orders";
import {
  clearShipmentDeliveryExceptionDetails,
  setShipmentDeliveryExceptionDetails,
} from "@/lib/db/supabase-shipments";
import { recordOrderStatusEvent } from "@/lib/db/supabase-order-events";
import { notifyCustomerOfStatusEvent } from "@/lib/email/send-order-emails";
import { SHIPPING_STATUSES, type ShippingStatus } from "@/lib/shipping-status";
import { isAdminLoggedIn } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const newStatus = body.shipping_status as ShippingStatus;

  if (!SHIPPING_STATUSES.includes(newStatus)) {
    return NextResponse.json({ error: "Invalid shipping_status" }, { status: 400 });
  }

  const current = await getOrderById(id);
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Shipping can't visibly start until order processing has actually
  // finished — enforced here, not just via a disabled dropdown.
  if (newStatus !== "not_shipped" && current.processing_status !== "processing_complete") {
    return NextResponse.json(
      { error: "Complete order processing before shipping can start." },
      { status: 400 }
    );
  }

  if (newStatus === "delivery_exception") {
    const reason = typeof body.delivery_exception_reason === "string"
      ? body.delivery_exception_reason.trim()
      : "";
    if (!reason) {
      return NextResponse.json(
        { error: "delivery_exception_reason is required" },
        { status: 400 }
      );
    }
    await setShipmentDeliveryExceptionDetails(id, reason);
  } else if (current.shipping_status === "delivery_exception") {
    await clearShipmentDeliveryExceptionDetails(id);
  }

  const updated = await updateOrderShippingStatus(id, newStatus);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (newStatus === "delivery_exception") {
    const event = await recordOrderStatusEvent({
      orderId: id,
      eventType: "delivery_exception_set",
      previousValue: current.shipping_status,
      newValue: String(body.delivery_exception_reason).trim(),
    });
    notifyCustomerOfStatusEvent(event.id).catch((err) => {
      console.error("[admin/orders/shipping-status] Notification email failed:", err);
    });
  } else {
    if (current.shipping_status === "delivery_exception") {
      await recordOrderStatusEvent({
        orderId: id,
        eventType: "delivery_exception_resolved",
        previousValue: "delivery_exception",
        newValue: newStatus,
      });
    }

    const event = await recordOrderStatusEvent({
      orderId: id,
      eventType: "shipping_status",
      previousValue: current.shipping_status,
      newValue: newStatus,
    });
    notifyCustomerOfStatusEvent(event.id).catch((err) => {
      console.error("[admin/orders/shipping-status] Notification email failed:", err);
    });
  }

  return NextResponse.json(updated);
}
