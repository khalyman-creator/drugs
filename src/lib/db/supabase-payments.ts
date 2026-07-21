import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type PaymentRecord = {
  id: string;
  order_id: string;
  provider: string;
  provider_payment_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export async function createPaymentRecord(input: {
  orderId: string;
  provider: string;
  amount: number;
  currency?: string;
  status?: PaymentStatus;
  paymentUrl?: string;
  providerPaymentId?: string;
  metadata?: Record<string, unknown>;
}): Promise<PaymentRecord> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("payments")
    .insert({
      order_id: input.orderId,
      provider: input.provider,
      amount: input.amount,
      currency: input.currency ?? "USD",
      status: input.status ?? "pending",
      payment_url: input.paymentUrl ?? null,
      provider_payment_id: input.providerPaymentId ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as PaymentRecord;
}

export async function updatePaymentRecord(
  id: string,
  patch: Partial<
    Pick<
      PaymentRecord,
      "status" | "payment_url" | "provider_payment_id" | "metadata"
    >
  >
): Promise<PaymentRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("payments")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data as PaymentRecord | null;
}

export async function findPaymentByOrderId(
  orderId: string
): Promise<PaymentRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as PaymentRecord | null;
}

export async function findPaymentByProviderId(
  provider: string,
  providerPaymentId: string
): Promise<PaymentRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("provider", provider)
    .eq("provider_payment_id", providerPaymentId)
    .maybeSingle();

  if (error) throw error;
  return data as PaymentRecord | null;
}
