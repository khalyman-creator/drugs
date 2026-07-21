import { createHmac } from "node:crypto";
import {
  getNowPaymentsApiKey,
  getNowPaymentsIpnSecret,
  getSiteUrl,
} from "@/lib/env";

const NOWPAYMENTS_API = "https://api.nowpayments.io/v1/invoice";

export type NowPaymentsWebhookPayload = {
  payment_id?: number | string;
  invoice_id?: number | string;
  order_id?: string;
  payment_status?: string;
  price_amount?: number | string;
  actually_paid_at_fiat?: number | string | null;
};

function parseNumericAmount(
  value: number | string | null | undefined
): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

export function isNowPaymentsApiConfigured(): boolean {
  return Boolean(getNowPaymentsApiKey());
}

export function getNowPaymentsStaticPaymentUrl(): string {
  const iid = process.env.NOWPAYMENTS_BUTTON_IID ?? "4682099423";
  return `https://nowpayments.io/payment/?iid=${iid}&source=button`;
}

export function buildNowPaymentsUrls(orderId: string) {
  const siteUrl = getSiteUrl().replace(/\/$/, "");
  return {
    callbackUrl: `${siteUrl}/api/payments/webhook/nowpayments`,
    successUrl: `${siteUrl}/success?orderId=${orderId}`,
    cancelUrl: `${siteUrl}/checkout?payment=failed&orderId=${orderId}`,
  };
}

export async function createAutoOrderInvoice(input: {
  orderId: string;
  amount: number;
  currency?: string;
  customerEmail?: string;
}): Promise<{
  paymentUrl: string;
  transactionId: string;
  mode: "api_invoice" | "static_invoice_link";
}> {
  if (isNowPaymentsApiConfigured()) {
    const urls = buildNowPaymentsUrls(input.orderId);
    const invoice = await createNowPaymentsInvoice({
      orderId: input.orderId,
      amount: input.amount,
      currency: input.currency,
      customerEmail: input.customerEmail,
      callbackUrl: urls.callbackUrl,
      successUrl: urls.successUrl,
      cancelUrl: urls.cancelUrl,
    });

    if (invoice.ok) {
      return {
        paymentUrl: invoice.paymentUrl,
        transactionId: invoice.invoiceId,
        mode: "api_invoice",
      };
    }

    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Could not create payment invoice: ${invoice.error}. Check NOWPAYMENTS_API_KEY and order amount meets the minimum.`
      );
    }
  } else if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NOWPAYMENTS_API_KEY is required in production to create customer invoices."
    );
  }

  const invoiceId = process.env.NOWPAYMENTS_BUTTON_IID ?? "4682099423";
  return {
    paymentUrl: getNowPaymentsStaticPaymentUrl(),
    transactionId: invoiceId,
    mode: "static_invoice_link",
  };
}

export async function createNowPaymentsInvoice(input: {
  orderId: string;
  amount: number;
  currency?: string;
  callbackUrl: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}): Promise<
  | { ok: true; paymentUrl: string; invoiceId: string }
  | { ok: false; error: string }
> {
  const apiKey = getNowPaymentsApiKey();
  if (!apiKey) {
    return { ok: false, error: "NOWPayments is not configured" };
  }

  const body: Record<string, string | number> = {
    price_amount: input.amount,
    price_currency: (input.currency ?? "USD").toLowerCase(),
    order_id: input.orderId,
    order_description: `RawDrop order ${input.orderId}`,
    ipn_callback_url: input.callbackUrl,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  };

  if (input.customerEmail) {
    body.customer_email = input.customerEmail;
  }

  try {
    const response = await fetch(NOWPAYMENTS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json().catch(() => null)) as {
      invoice_url?: string;
      id?: number | string;
      message?: string;
    } | null;

    if (!response.ok || data?.id == null) {
      return {
        ok: false,
        error: data?.message ?? `NOWPayments API error (${response.status})`,
      };
    }

    const invoiceId = String(data.id);
    const paymentUrl =
      data.invoice_url ??
      `https://nowpayments.io/payment/?iid=${encodeURIComponent(invoiceId)}`;

    return { ok: true, paymentUrl, invoiceId };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "NOWPayments invoice request failed",
    };
  }
}

function sortObjectDeep(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const record = value as Record<string, unknown>;
  return Object.keys(record)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = sortObjectDeep(record[key]);
      return acc;
    }, {});
}

export function verifyNowPaymentsWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const ipnSecret = getNowPaymentsIpnSecret();
  if (!ipnSecret || !signatureHeader) return false;

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return false;
  }

  const sorted = sortObjectDeep(payload);
  const serialized = JSON.stringify(sorted);
  const expected = createHmac("sha512", ipnSecret)
    .update(serialized)
    .digest("hex");

  return expected === signatureHeader;
}

export function parseNowPaymentsWebhookPayload(
  rawBody: string
): NowPaymentsWebhookPayload | null {
  try {
    return JSON.parse(rawBody) as NowPaymentsWebhookPayload;
  } catch {
    return null;
  }
}

export function mapNowPaymentsPaymentStatus(
  payload: NowPaymentsWebhookPayload,
  expectedAmountUsd?: number | null
): "pending" | "paid" | "failed" {
  const normalized = (payload.payment_status ?? "").toLowerCase();

  if (normalized === "failed" || normalized === "refunded" || normalized === "expired") {
    return "failed";
  }

  if (normalized !== "finished") {
    return "pending";
  }

  if (expectedAmountUsd == null || expectedAmountUsd <= 0) {
    return "paid";
  }

  const tolerance = 0.01;
  const paidFiat = parseNumericAmount(payload.actually_paid_at_fiat);
  if (paidFiat != null && paidFiat > 0) {
    return paidFiat + tolerance >= expectedAmountUsd ? "paid" : "pending";
  }

  const price = parseNumericAmount(payload.price_amount);
  if (price != null && price > 0) {
    return price + tolerance >= expectedAmountUsd ? "paid" : "pending";
  }

  return "paid";
}
