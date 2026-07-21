import Link from "next/link";
import { getOrderById } from "@/lib/db/supabase-orders";
import { findPaymentByOrderId } from "@/lib/db/supabase-payments";
import { ensureOrderReceiptEmail } from "@/lib/email/send-order-emails";
import { isEmailConfigured } from "@/lib/email/resend";
import { formatOrderReference } from "@/lib/email/order-ref";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.orderId;

  let orderRef: string | null = null;
  let isPaid = false;
  let invoiceSent = false;
  let receiptSent = false;

  if (orderId) {
    const order = await getOrderById(orderId);
    const payment = await findPaymentByOrderId(orderId);

    if (order) {
      orderRef = formatOrderReference(order.id);
      isPaid = order.status === "paid";
      invoiceSent = Boolean(payment?.metadata?.invoice_email_sent_at);
      receiptSent = Boolean(payment?.metadata?.receipt_email_sent_at);

      if (isPaid && !receiptSent) {
        await ensureOrderReceiptEmail(orderId);
        receiptSent = true;
      }
    }
  }

  const emailConfigured = isEmailConfigured();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
        ✓
      </div>
      <h1 className="text-3xl font-bold text-gray-900">Thank you!</h1>

      {isPaid ? (
        <p className="mt-4 text-gray-600">
          Your payment is confirmed.
          {emailConfigured
            ? " Check your inbox for your invoice and payment receipt."
            : " Your order is being processed."}
        </p>
      ) : (
        <p className="mt-4 text-gray-600">
          {emailConfigured
            ? "Your invoice has been emailed to you. Once payment confirms, your receipt will arrive in a second email."
            : "Your payment is being confirmed. You will receive email updates once configured."}
        </p>
      )}

      {orderRef && (
        <p className="mt-2 text-sm text-gray-500">
          Order reference: <span className="font-mono font-semibold text-gray-800">{orderRef}</span>
        </p>
      )}

      {emailConfigured && orderId && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-left text-sm text-gray-600">
          <p className="font-semibold text-gray-900">Email notifications</p>
          <ul className="mt-2 space-y-1">
            <li>{invoiceSent ? "✓ Invoice sent" : "○ Invoice pending"}</li>
            <li>{receiptSent || isPaid ? "✓ Receipt sent" : "○ Receipt after payment confirms"}</li>
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/products" className="btn-primary">
          Continue shopping
        </Link>
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
