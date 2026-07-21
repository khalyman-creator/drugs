import { getOrderById } from "@/lib/db/supabase-orders";
import {
  findPaymentByOrderId,
  updatePaymentRecord,
} from "@/lib/db/supabase-payments";
import { getAdminEmail } from "@/lib/env";
import { buildInvoiceEmailHtml, buildReceiptEmailHtml } from "./order-templates";
import { formatOrderReference } from "./order-ref";
import { isEmailConfigured, sendEmail } from "./resend";

async function markEmailSent(
  orderId: string,
  field: "invoice_email_sent_at" | "receipt_email_sent_at"
): Promise<boolean> {
  const payment = await findPaymentByOrderId(orderId);
  if (!payment) return false;

  const metadata = payment.metadata ?? {};
  if (metadata[field]) return false;

  await updatePaymentRecord(payment.id, {
    metadata: {
      ...metadata,
      [field]: new Date().toISOString(),
    },
  });

  return true;
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
  if (payment?.metadata?.invoice_email_sent_at) {
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
    subject: `RawDrop Invoice ${orderRef} — ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(order.total))} due`,
    html,
    replyTo: getAdminEmail(),
  });

  if (!result.ok) {
    return { sent: false, error: result.error };
  }

  await markEmailSent(input.orderId, "invoice_email_sent_at");
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
  if (payment?.metadata?.receipt_email_sent_at) {
    return { sent: false, error: "Receipt already sent" };
  }

  const orderRef = formatOrderReference(order.id);
  const html = buildReceiptEmailHtml({
    order,
    transactionId: input.transactionId ?? payment?.provider_payment_id ?? undefined,
    paidAt: input.paidAt,
  });

  const result = await sendEmail({
    to: order.customer.email,
    subject: `RawDrop Receipt ${orderRef} — Payment confirmed`,
    html,
    replyTo: getAdminEmail(),
  });

  if (!result.ok) {
    return { sent: false, error: result.error };
  }

  await markEmailSent(input.orderId, "receipt_email_sent_at");
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
