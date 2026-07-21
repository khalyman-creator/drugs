import { createCustomer } from "@/lib/db/supabase-customers";
import {
  createOrderRecord,
  failOrderIfUnpaid,
  finalizeOrderPaid,
  getOrderById,
  type CreateOrderItemInput,
} from "@/lib/db/supabase-orders";
import {
  findPaymentByOrderId,
  updatePaymentRecord,
} from "@/lib/db/supabase-payments";
import { isSupabaseConfigured } from "@/lib/env";
import { ensureOrderReceiptEmail, sendOrderInvoiceEmail } from "@/lib/email/send-order-emails";
import { createCheckoutPayment } from "@/lib/payments";
import type { CheckoutCustomerInput, CheckoutResult } from "./types";

export type { CheckoutCustomerInput, CheckoutResult } from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_CHECKOUT_USD = 20;

function validateCustomer(input: CheckoutCustomerInput): void {
  if (!input.fullName.trim() || input.fullName.length > 120) {
    throw new Error("Invalid customer name");
  }

  if (!EMAIL_PATTERN.test(input.email) || input.email.length > 254) {
    throw new Error("Invalid customer email");
  }

  if (input.phone && input.phone.length > 40) {
    throw new Error("Invalid phone number");
  }

  if (input.shippingAddress && input.shippingAddress.length > 500) {
    throw new Error("Invalid shipping address");
  }
}

export async function processCheckout(input: {
  items: CreateOrderItemInput[];
  customer: CheckoutCustomerInput;
  shipping?: number;
}): Promise<CheckoutResult> {
  validateCustomer(input.customer);

  if (!input.items.length) {
    throw new Error("Cart is empty");
  }

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Orders cannot be saved — Supabase is not configured. Add Supabase env vars and redeploy."
    );
  }

  const subtotal = input.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = input.shipping ?? 0;
  const total = subtotal + shipping;

  if (total < MIN_CHECKOUT_USD) {
    throw new Error(`Minimum order amount is $${MIN_CHECKOUT_USD}`);
  }

  const customer = await createCustomer({
    fullName: input.customer.fullName,
    email: input.customer.email,
    phone: input.customer.phone,
    shippingAddress: input.customer.shippingAddress,
  });

  const order = await createOrderRecord({
    customerId: customer.id,
    items: input.items,
    shipping,
  });

  const payment = await createCheckoutPayment({
    orderId: order.id,
    amount: Number(order.total),
    customerEmail: customer.email,
  });

  if (!payment.paymentUrl) {
    throw new Error("Could not create payment session");
  }

  sendOrderInvoiceEmail({
    orderId: order.id,
    paymentUrl: payment.paymentUrl,
    transactionId: payment.transactionId,
  }).catch((err) => {
    console.error("[checkout] Invoice email failed:", err);
  });

  return {
    orderId: order.id,
    total: Number(order.total),
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    status: order.status,
    redirectUrl: payment.paymentUrl,
    payment: {
      provider: payment.provider,
      status: payment.status,
      paymentUrl: payment.paymentUrl,
      transactionId: payment.transactionId,
    },
  };
}

export async function markOrderPaid(orderId: string): Promise<void> {
  const transitioned = await finalizeOrderPaid(orderId);
  if (!transitioned) return;
}

export async function markOrderFailed(orderId: string): Promise<void> {
  const failed = await failOrderIfUnpaid(orderId);
  if (!failed) return;

  const payment = await findPaymentByOrderId(orderId);
  if (payment && payment.status !== "failed" && payment.status !== "paid") {
    await updatePaymentRecord(payment.id, { status: "failed" });
  }
}

export async function handlePaidWebhook(
  orderId: string,
  options?: { duplicate?: boolean }
): Promise<void> {
  if (options?.duplicate) return;

  const order = await getOrderById(orderId);
  if (order?.status === "paid") return;

  await markOrderPaid(orderId);

  ensureOrderReceiptEmail(orderId).catch((err) => {
    console.error("[webhook] Receipt email failed:", err);
  });
}
