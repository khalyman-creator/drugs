import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type OrderStatusEventType =
  | "control_status"
  | "processing_status"
  | "shipping_status"
  | "hold_placed"
  | "hold_released"
  | "delivery_exception_set"
  | "delivery_exception_resolved";

export type OrderStatusEvent = {
  id: string;
  order_id: string;
  event_type: OrderStatusEventType;
  previous_value: string | null;
  new_value: string | null;
  reason: string | null;
  customer_message: string | null;
  created_by: "admin" | "system";
  email_sent_at: string | null;
  occurred_at: string;
  created_at: string;
};

export async function recordOrderStatusEvent(input: {
  orderId: string;
  eventType: OrderStatusEventType;
  previousValue?: string | null;
  newValue?: string | null;
  reason?: string | null;
  customerMessage?: string | null;
  createdBy?: "admin" | "system";
  occurredAt?: string | null;
}): Promise<OrderStatusEvent> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("order_status_events")
    .insert({
      order_id: input.orderId,
      event_type: input.eventType,
      previous_value: input.previousValue ?? null,
      new_value: input.newValue ?? null,
      reason: input.reason ?? null,
      customer_message: input.customerMessage ?? null,
      created_by: input.createdBy ?? "admin",
      ...(input.occurredAt ? { occurred_at: input.occurredAt } : {}),
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as OrderStatusEvent;
}

export async function listOrderStatusEvents(orderId: string): Promise<OrderStatusEvent[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("order_status_events")
    .select("*")
    .eq("order_id", orderId)
    .order("occurred_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as OrderStatusEvent[];
}

export async function getOrderStatusEventById(
  eventId: string
): Promise<OrderStatusEvent | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("order_status_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (error) throw error;
  return (data as OrderStatusEvent | null) ?? null;
}
