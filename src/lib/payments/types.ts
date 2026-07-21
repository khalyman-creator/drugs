export type PaymentProviderId = "nowpayments";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type CreatePaymentSessionInput = {
  orderId: string;
  amount: number;
  currency?: string;
  customerEmail?: string;
};

export type PaymentSessionResult = {
  provider: PaymentProviderId;
  paymentId: string;
  status: PaymentStatus;
  paymentUrl?: string;
  transactionId?: string;
  message?: string;
};

export type PaymentWebhookResult = {
  orderId: string;
  paymentId: string;
  status: PaymentStatus;
  providerPaymentId?: string;
  duplicate?: boolean;
};
