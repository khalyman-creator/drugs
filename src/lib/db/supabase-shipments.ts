import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { HoldReason } from "@/lib/shipping-status";

export type ShipmentRecord = {
  id: string;
  order_id: string;
  carrier: string | null;
  tracking_number: string | null;
  shipment_type: string | null;
  weight_value: number | null;
  weight_unit: string | null;
  origin: string | null;
  destination: string | null;
  estimated_delivery: string | null;
  hold_active: boolean;
  hold_reason: HoldReason | null;
  hold_customer_message: string | null;
  hold_internal_note: string | null;
  hold_placed_at: string | null;
  delivery_exception_reason: string | null;
  delivery_exception_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getShipmentByOrderId(orderId: string): Promise<ShipmentRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) throw error;
  return (data as ShipmentRecord | null) ?? null;
}

/** Ensures a shipment row exists for this order (lazily created on first admin write/read). */
export async function getOrCreateShipmentForOrder(orderId: string): Promise<ShipmentRecord> {
  const existing = await getShipmentByOrderId(orderId);
  if (existing) return existing;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shipments")
    .insert({ order_id: orderId })
    .select("*")
    .maybeSingle();

  if (!error && data) return data as ShipmentRecord;

  // 23505 = unique violation — a concurrent request already created it; fall
  // through to re-fetch. Any other error is real and should surface.
  if (error && error.code !== "23505") throw error;

  const created = await getShipmentByOrderId(orderId);
  if (!created) throw new Error("Failed to create shipment record");
  return created;
}

export async function updateShipmentInfo(
  orderId: string,
  patch: Partial<
    Pick<
      ShipmentRecord,
      | "carrier"
      | "tracking_number"
      | "shipment_type"
      | "weight_value"
      | "weight_unit"
      | "origin"
      | "destination"
      | "estimated_delivery"
    >
  >
): Promise<ShipmentRecord | null> {
  await getOrCreateShipmentForOrder(orderId);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shipments")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (data as ShipmentRecord | null) ?? null;
}

export async function setShipmentHold(
  orderId: string,
  input: { reason: HoldReason; customerMessage?: string; internalNote?: string }
): Promise<ShipmentRecord | null> {
  await getOrCreateShipmentForOrder(orderId);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shipments")
    .update({
      hold_active: true,
      hold_reason: input.reason,
      hold_customer_message: input.customerMessage ?? null,
      hold_internal_note: input.internalNote ?? null,
      hold_placed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (data as ShipmentRecord | null) ?? null;
}

/** Clears the active flag only — reason/message/note stay as admin-visible history of the last hold. */
export async function releaseShipmentHold(orderId: string): Promise<ShipmentRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shipments")
    .update({ hold_active: false, updated_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (data as ShipmentRecord | null) ?? null;
}

export async function setShipmentDeliveryExceptionDetails(
  orderId: string,
  reason: string
): Promise<ShipmentRecord | null> {
  await getOrCreateShipmentForOrder(orderId);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shipments")
    .update({
      delivery_exception_reason: reason,
      delivery_exception_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (data as ShipmentRecord | null) ?? null;
}

export async function clearShipmentDeliveryExceptionDetails(
  orderId: string
): Promise<ShipmentRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shipments")
    .update({
      delivery_exception_reason: null,
      delivery_exception_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (data as ShipmentRecord | null) ?? null;
}
