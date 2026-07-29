import { getOrderById } from "@/lib/db/supabase-orders";
import {
  findPaymentByOrderId,
  updatePaymentRecord,
  type PaymentRecord,
} from "@/lib/db/supabase-payments";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAdminEmail } from "@/lib/env";
import {
  buildAdminOrderNotificationHtml,
  buildInvoiceEmailHtml,
  buildReceiptEmailHtml,
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
