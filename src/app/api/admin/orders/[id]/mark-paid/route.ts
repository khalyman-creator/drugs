import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/db/supabase-orders";
import { findPaymentByOrderId, updatePaymentRecord } from "@/lib/db/supabase-payments";
import { markOrderPaid } from "@/lib/checkout/service";
import { ensureOrderReceiptEmail } from "@/lib/email/send-order-emails";
import { keepAlive } from "@/lib/background-task";
import { isAdminLoggedIn } from "@/lib/auth";

/**
 * Manual payment confirmation for orders paid outside the automatic
 * NOWPayments webhook (e.g. an alternate payment method, or reconciling a
 * webhook that never arrived). Distinct from the webhook path, but drives
 * the exact same order-paid transition and receipt email so the two stay
 * indistinguishable to the customer.
 */
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

  if (order.status === "paid") {
    return NextResponse.json(order);
  }

  const payment = await findPaymentByOrderId(id);
  if (payment && payment.status !== "paid") {
    await updatePaymentRecord(payment.id, {
      status: "paid",
      metadata: {
        ...(payment.metadata ?? {}),
        paid_at: new Date().toISOString(),
        marked_paid_manually: true,
      },
    });
  }

  await markOrderPaid(id);

  keepAlive(
    ensureOrderReceiptEmail(id).catch((err) => {
      console.error("[admin/orders/mark-paid] Receipt email failed:", err);
    })
  );

  const updated = await getOrderById(id);
  return NextResponse.json(updated);
}
