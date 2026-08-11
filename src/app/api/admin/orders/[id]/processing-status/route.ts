import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrderProcessingStatus } from "@/lib/db/supabase-orders";
import { recordOrderStatusEvent } from "@/lib/db/supabase-order-events";
import { notifyCustomerOfStatusEvent } from "@/lib/email/send-order-emails";
import { PROCESSING_STATUSES, type ProcessingStatus } from "@/lib/shipping-status";
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
  const newStatus = body.processing_status as ProcessingStatus;
  const reason = typeof body.reason === "string" ? body.reason.trim() || null : null;
  const occurredAt = typeof body.occurred_at === "string" ? body.occurred_at.trim() || null : null;

  if (!PROCESSING_STATUSES.includes(newStatus)) {
    return NextResponse.json({ error: "Invalid processing_status" }, { status: 400 });
  }
  if (occurredAt && new Date(occurredAt).getTime() > Date.now()) {
    return NextResponse.json({ error: "Cannot backdate to the future." }, { status: 400 });
  }

  const current = await getOrderById(id);
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await updateOrderProcessingStatus(id, newStatus);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const event = await recordOrderStatusEvent({
    orderId: id,
    eventType: "processing_status",
    previousValue: current.processing_status,
    newValue: newStatus,
    reason,
    occurredAt,
  });

  notifyCustomerOfStatusEvent(event.id).catch((err) => {
    console.error("[admin/orders/processing-status] Notification email failed:", err);
  });

  return NextResponse.json(updated);
}
