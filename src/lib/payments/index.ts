import { createOrderInvoice, handleProviderWebhook } from "./provider";
import type {
  CreatePaymentSessionInput,
  PaymentSessionResult,
  PaymentWebhookResult,
} from "./types";

export async function createCheckoutPayment(
  input: CreatePaymentSessionInput
): Promise<PaymentSessionResult> {
  const invoice = await createOrderInvoice({
    orderId: input.orderId,
    amount: input.amount,
    currency: input.currency,
    customerEmail: input.customerEmail,
  });

  return {
    provider: invoice.provider,
    paymentId: invoice.paymentId,
    status: invoice.status === "failed" ? "failed" : "pending",
    paymentUrl: invoice.paymentUrl,
    transactionId: invoice.transactionId,
    message: invoice.message,
  };
}

export async function handlePaymentWebhook(
  rawBody: string,
  headers: Headers
): Promise<PaymentWebhookResult | null> {
  const result = await handleProviderWebhook(rawBody, headers);
  if (!result) return null;

  return {
    orderId: result.orderId,
    paymentId: result.paymentId,
    status: result.status,
    providerPaymentId: result.providerPaymentId,
    duplicate: result.duplicate,
  };
}
