import { getOrderById } from "@/lib/db/supabase-orders";
import {
  findPaymentByOrderId,
  updatePaymentRecord,
  type PaymentRecord,
} from "@/lib/db/supabase-payments";
import { getShipmentByOrderId } from "@/lib/db/supabase-shipments";
import {
  getOrderStatusEventById,
  type OrderStatusEvent,
  type OrderStatusEventType,
} from "@/lib/db/supabase-order-events";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAdminEmail } from "@/lib/env";
import {
  buildAdminOrderNotificationHtml,
  buildDeliveryExceptionEmailHtml,
  buildInvoiceEmailHtml,
  buildOrderCancelledEmailHtml,
  buildProcessingCompleteEmailHtml,
  buildReceiptEmailHtml,
  buildShipmentHoldEmailHtml,
  buildShippingMilestoneEmailHtml,
} from "./order-templates";
import { formatOrderReference } from "./order-ref";
import { isEmailConfigured, sendEmail } from "./resend";

type EmailField = "invoice_email_sent_at" | "receipt_email_sent_at" | "admin_notified_at";

/**
 * Atomically claims the right to send this email — the WHERE guard is
 * evaluated by Postgres against the row's live state at UPDATE time, so
 * concurrent callers (e.g. a webhook retry racing the /success page) can
 * never both win the claim, even though they may both have read a stale
 * "not sent yet" snapshot moments earlier.
 */
async function claimEmailSend(
  payment: PaymentRecord,
  field: EmailField
): Promise<boolean> {
  if (payment.metadata?.[field]) return false;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("payments")
    .update({
      metadata: { ...(payment.metadata ?? {}), [field]: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .is(`metadata->>${field}`, null)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return data != null;
}

/** Releases a claim after a send actually fails, so a later retry can try again. */
async function releaseEmailClaim(paymentId: string, field: EmailField): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("payments")
    .select("metadata")
    .eq("id", paymentId)
    .maybeSingle();

  const metadata = { ...(data?.metadata ?? {}) };
  delete metadata[field];
  await updatePaymentRecord(paymentId, { metadata });
}

export async function sendOrderInvoiceEmail(input: {
  orderId: string;
  paymentUrl: string;
  transactionId?: string;
}): Promise<{ sent: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  const order = await getOrderById(input.orderId);
  if (!order?.customer?.email) {
    return { sent: false, error: "Order or customer email not found" };
  }

  const payment = await findPaymentByOrderId(input.orderId);
  if (!payment) {
    return { sent: false, error: "Payment record not found" };
  }

  const claimed = await claimEmailSend(payment, "invoice_email_sent_at");
  if (!claimed) {
    return { sent: false, error: "Invoice already sent" };
  }

  const orderRef = formatOrderReference(order.id);
  const html = buildInvoiceEmailHtml({
    order,
    paymentUrl: input.paymentUrl,
    transactionId: input.transactionId,
  });

  const result = await sendEmail({
    to: order.customer.email,
    subject: `SilkFreedom Invoice ${orderRef} — ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(order.total))} due`,
    html,
    replyTo: getAdminEmail(),
  });

  if (!result.ok) {
    await releaseEmailClaim(payment.id, "invoice_email_sent_at");
    return { sent: false, error: result.error };
  }

  return { sent: true };
}

/** Notify the seller that a new order was placed (fires before payment confirms). */
export async function sendAdminOrderNotification(
  orderId: string
): Promise<{ sent: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return { sent: false, error: "Order not found" };
  }

  const payment = await findPaymentByOrderId(orderId);
  if (!payment) {
    return { sent: false, error: "Payment record not found" };
  }

  const claimed = await claimEmailSend(payment, "admin_notified_at");
  if (!claimed) {
    return { sent: false, error: "Admin already notified" };
  }

  const orderRef = formatOrderReference(order.id);
  const html = buildAdminOrderNotificationHtml({ order });

  const result = await sendEmail({
    to: getAdminEmail(),
    subject: `New order ${orderRef} — ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(order.total))}`,
    html,
    replyTo: order.customer?.email,
  });

  if (!result.ok) {
    await releaseEmailClaim(payment.id, "admin_notified_at");
    return { sent: false, error: result.error };
  }

  return { sent: true };
}

export async function sendOrderReceiptEmail(input: {
  orderId: string;
  transactionId?: string;
  paidAt?: string;
}): Promise<{ sent: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  const order = await getOrderById(input.orderId);
  if (!order?.customer?.email) {
    return { sent: false, error: "Order or customer email not found" };
  }

  if (order.status !== "paid") {
    return { sent: false, error: "Order is not paid yet" };
  }

  const payment = await findPaymentByOrderId(input.orderId);
  if (!payment) {
    return { sent: false, error: "Payment record not found" };
  }

  const claimed = await claimEmailSend(payment, "receipt_email_sent_at");
  if (!claimed) {
    return { sent: false, error: "Receipt already sent" };
  }

  const orderRef = formatOrderReference(order.id);
  const html = buildReceiptEmailHtml({
    order,
    transactionId: input.transactionId ?? payment.provider_payment_id ?? undefined,
    paidAt: input.paidAt,
  });

  const result = await sendEmail({
    to: order.customer.email,
    subject: `SilkFreedom Receipt ${orderRef} — Payment confirmed`,
    html,
    replyTo: getAdminEmail(),
  });

  if (!result.ok) {
    await releaseEmailClaim(payment.id, "receipt_email_sent_at");
    return { sent: false, error: result.error };
  }

  return { sent: true };
}

/** Send receipt when payment confirmed (webhook or success page fallback). */
export async function ensureOrderReceiptEmail(orderId: string): Promise<void> {
  const payment = await findPaymentByOrderId(orderId);
  await sendOrderReceiptEmail({
    orderId,
    transactionId: payment?.provider_payment_id ?? undefined,
    paidAt:
      typeof payment?.metadata?.paid_at === "string"
        ? payment.metadata.paid_at
        : undefined,
  });
}

// ---------------------------------------------------------------------------
// Order-tracking status-change notifications.
//
// Mirrors claimEmailSend/releaseEmailClaim exactly (same atomic conditional
// UPDATE, claim-before-send, release-on-failure), but the claim lives on the
// order_status_events row itself instead of payments.metadata — some of
// these transitions (holds, delivery exceptions) can legitimately recur on
// the same order, which a once-per-order boolean couldn't represent.
// ---------------------------------------------------------------------------

async function claimEventEmail(eventId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("order_status_events")
    .update({ email_sent_at: new Date().toISOString() })
    .eq("id", eventId)
    .is("email_sent_at", null)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return data != null;
}

async function releaseEventEmailClaim(eventId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from("order_status_events").update({ email_sent_at: null }).eq("id", eventId);
}

/** Which transitions actually notify the customer — everything else is left for the tracking timeline. */
function isNotifyWorthy(event: OrderStatusEvent): boolean {
  if (event.event_type === "processing_status") {
    return event.new_value === "processing_complete";
  }
  if (event.event_type === "shipping_status") {
    return event.new_value === "shipped" || event.new_value === "out_for_delivery" || event.new_value === "delivered";
  }
  if (event.event_type === "delivery_exception_set") return true;
  if (event.event_type === "hold_placed") return true;
  if (event.event_type === "control_status") return event.new_value === "cancelled";
  // hold_released, delivery_exception_resolved, and non-cancelled control
  // changes are intentionally silent — visible in the timeline, no email.
  return false;
}

const NOTIFY_EVENT_TYPES: OrderStatusEventType[] = [
  "processing_status",
  "shipping_status",
  "delivery_exception_set",
  "hold_placed",
  "control_status",
];

export async function notifyCustomerOfStatusEvent(eventId: string): Promise<{ sent: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  const event = await getOrderStatusEventById(eventId);
  if (!event || !NOTIFY_EVENT_TYPES.includes(event.event_type) || !isNotifyWorthy(event)) {
    return { sent: false, error: "Not a notify-worthy transition" };
  }

  const order = await getOrderById(event.order_id);
  if (!order?.customer?.email) {
    return { sent: false, error: "Order or customer email not found" };
  }

  const claimed = await claimEventEmail(eventId);
  if (!claimed) {
    return { sent: false, error: "Already notified for this event" };
  }

  const orderRef = formatOrderReference(order.id);
  let html: string;
  let subject: string;

  if (event.event_type === "shipping_status") {
    const milestone = event.new_value as "shipped" | "out_for_delivery" | "delivered";
    const shipment = await getShipmentByOrderId(order.id);
    html = buildShippingMilestoneEmailHtml({ order, shipment, milestone });
    subject = `SilkFreedom Order ${orderRef} — ${milestone === "shipped" ? "Shipped" : milestone === "out_for_delivery" ? "Out for Delivery" : "Delivered"}`;
  } else if (event.event_type === "processing_status") {
    html = buildProcessingCompleteEmailHtml({ order });
    subject = `SilkFreedom Order ${orderRef} — Ready to Ship`;
  } else if (event.event_type === "delivery_exception_set") {
    html = buildDeliveryExceptionEmailHtml({ order, reason: event.new_value ?? "Delivery delayed" });
    subject = `SilkFreedom Order ${orderRef} — Delivery Exception`;
  } else if (event.event_type === "hold_placed") {
    const reasonLabel = event.new_value ?? "On hold";
    html = buildShipmentHoldEmailHtml({ order, reason: reasonLabel, customerMessage: event.customer_message });
    subject = `SilkFreedom Order ${orderRef} — Shipment On Hold`;
  } else {
    html = buildOrderCancelledEmailHtml({ order });
    subject = `SilkFreedom Order ${orderRef} — Cancelled`;
  }

  const result = await sendEmail({
    to: order.customer.email,
    subject,
    html,
    replyTo: getAdminEmail(),
  });

  if (!result.ok) {
    await releaseEventEmailClaim(eventId);
    return { sent: false, error: result.error };
  }

  return { sent: true };
}
