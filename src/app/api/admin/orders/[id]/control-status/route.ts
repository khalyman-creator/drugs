import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrderControlStatus } from "@/lib/db/supabase-orders";
import { recordOrderStatusEvent } from "@/lib/db/supabase-order-events";
import { notifyCustomerOfStatusEvent } from "@/lib/email/send-order-emails";
import { CONTROL_STATUSES, type ControlStatus } from "@/lib/shipping-status";
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
  const newStatus = body.control_status as ControlStatus;

  if (!CONTROL_STATUSES.includes(newStatus)) {
    return NextResponse.json({ error: "Invalid control_status" }, { status: 400 });
  }

  const current = await getOrderById(id);
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await updateOrderControlStatus(id, newStatus);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const event = await recordOrderStatusEvent({
    orderId: id,
    eventType: "control_status",
    previousValue: current.control_status,
    newValue: newStatus,
  });

  notifyCustomerOfStatusEvent(event.id).catch((err) => {
    console.error("[admin/orders/control-status] Notification email failed:", err);
  });

  return NextResponse.json(updated);
}
