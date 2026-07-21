import {
  createPaymentRecord,
  findPaymentByOrderId,
  findPaymentByProviderId,
  updatePaymentRecord,
} from "@/lib/db/supabase-payments";
import { getOrderById } from "@/lib/db/supabase-orders";
import { isSupabaseConfigured } from "@/lib/env";
import {
  createAutoOrderInvoice,
  mapNowPaymentsPaymentStatus,
  parseNowPaymentsWebhookPayload,
  verifyNowPaymentsWebhookSignature,
} from "@/lib/payments/nowpayments/client";
import type { PaymentProviderId, PaymentStatus } from "./types";

export type InvoiceOrder = {
  orderId: string;
  amount: number;
  currency?: string;
  customerEmail?: string;
};

export type InvoiceResult = {
  provider: PaymentProviderId;
  paymentId: string;
  paymentUrl?: string;
  transactionId?: string;
  status: "pending" | "failed";
  message?: string;
};

export type WebhookHandleResult = {
  orderId: string;
  paymentId: string;
  status: PaymentStatus;
  providerPaymentId?: string;
  duplicate?: boolean;
};

async function createNowPaymentsOrderInvoice(
  order: InvoiceOrder
): Promise<InvoiceResult> {
  const checkout = await createAutoOrderInvoice({
    orderId: order.orderId,
    amount: order.amount,
    currency: order.currency,
    customerEmail: order.customerEmail,
  });

  let paymentId = `offline-${order.orderId}`;

  if (isSupabaseConfigured()) {
    const payment = await createPaymentRecord({
      orderId: order.orderId,
      provider: "nowpayments",
      amount: order.amount,
      currency: order.currency ?? "USD",
      status: "pending",
      paymentUrl: checkout.paymentUrl,
      providerPaymentId: checkout.transactionId,
      metadata: {
        customerEmail: order.customerEmail,
        payment_method: "nowpayments",
        mode: checkout.mode,
        invoice_id: checkout.transactionId,
      },
    });
    paymentId = payment.id;
  }

  return {
    provider: "nowpayments",
    paymentId,
    paymentUrl: checkout.paymentUrl,
    transactionId: checkout.transactionId,
    status: "pending",
  };
}

export async function createOrderInvoice(
  order: InvoiceOrder
): Promise<InvoiceResult> {
  if (isSupabaseConfigured()) {
    const existing = await findPaymentByOrderId(order.orderId);
    if (existing?.payment_url) {
      return {
        provider: "nowpayments",
        paymentId: existing.id,
        paymentUrl: existing.payment_url,
        transactionId: existing.provider_payment_id ?? undefined,
        status: "pending",
      };
    }
  }

  return createNowPaymentsOrderInvoice(order);
}

export async function handleProviderWebhook(
  rawBody: string,
  headers: Headers
): Promise<WebhookHandleResult | null> {
  const signature = headers.get("x-nowpayments-sig");
  if (!verifyNowPaymentsWebhookSignature(rawBody, signature)) {
    return null;
  }

  const payload = parseNowPaymentsWebhookPayload(rawBody);
  if (!payload?.order_id) {
    return null;
  }

  const order = await getOrderById(payload.order_id);
  const mappedStatus = mapNowPaymentsPaymentStatus(
    payload,
    order ? Number(order.total) : null
  );

  let existing = await findPaymentByOrderId(payload.order_id);

  if (!existing) {
    const providerRef =
      payload.invoice_id != null
        ? String(payload.invoice_id)
        : payload.payment_id != null
          ? String(payload.payment_id)
          : null;

    if (providerRef) {
      existing = await findPaymentByProviderId("nowpayments", providerRef);
    }

    if (!existing && order) {
      existing = await createPaymentRecord({
        orderId: payload.order_id,
        provider: "nowpayments",
        amount: Number(order.total),
        currency: "USD",
        status: mappedStatus,
        providerPaymentId: providerRef ?? undefined,
        metadata: {
          payment_method: "nowpayments",
          created_from_webhook: true,
          lastWebhookStatus: payload.payment_status,
        },
      });
    }
  }

  if (existing?.status === "paid" && mappedStatus === "paid") {
    return {
      orderId: payload.order_id,
      paymentId: existing.id,
      status: "paid",
      providerPaymentId:
        payload.invoice_id != null
          ? String(payload.invoice_id)
          : existing.provider_payment_id ?? undefined,
      duplicate: true,
    };
  }

  if (existing) {
    const providerPaymentId =
      payload.invoice_id != null
        ? String(payload.invoice_id)
        : payload.payment_id != null
          ? String(payload.payment_id)
          : existing.provider_payment_id;

    await updatePaymentRecord(existing.id, {
      status: mappedStatus,
      provider_payment_id: providerPaymentId,
      metadata: {
        ...(existing.metadata ?? {}),
        payment_method: "nowpayments",
        invoice_id: providerPaymentId,
        ...(mappedStatus === "paid" ? { paid_at: new Date().toISOString() } : {}),
        lastWebhookStatus: payload.payment_status,
      },
    });
  }

  return {
    orderId: payload.order_id,
    paymentId: existing?.id ?? `webhook-${payload.order_id}`,
    status: mappedStatus,
    providerPaymentId:
      payload.invoice_id != null
        ? String(payload.invoice_id)
        : payload.payment_id != null
          ? String(payload.payment_id)
          : undefined,
  };
}
