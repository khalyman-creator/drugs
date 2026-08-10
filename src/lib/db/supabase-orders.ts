import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatOrderReference } from "@/lib/email/order-ref";
import type { CustomerRecord } from "./supabase-customers";
import type { ControlStatus, ProcessingStatus, ShippingStatus } from "@/lib/shipping-status";

export type OrderStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type OrderItemRecord = {
  id: string;
  order_id: string;
  product_id: number;
  name: string;
  price: number;
  image: string | null;
  category: string | null;
  brand: string | null;
  quantity: number;
};

export type OrderRecord = {
  id: string;
  customer_id: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  control_status: ControlStatus;
  processing_status: ProcessingStatus;
  shipping_status: ShippingStatus;
  created_at: string;
  updated_at: string;
};

export type OrderWithDetails = OrderRecord & {
  customer: CustomerRecord | null;
  items: OrderItemRecord[];
};

export type CreateOrderItemInput = {
  productId: number;
  name: string;
  price: number;
  image: string;
  category: string;
  brand?: string;
  quantity: number;
};

export async function createOrderRecord(input: {
  customerId: string;
  items: CreateOrderItemInput[];
  shipping?: number;
}): Promise<OrderWithDetails> {
  const shipping = input.shipping ?? 0;
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal + shipping;

  const supabase = getSupabaseAdmin();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: input.customerId,
      subtotal,
      shipping,
      total,
      status: "pending",
    })
    .select("*")
    .single();

  if (orderError) throw orderError;

  const itemRows = input.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    name: item.name,
    price: item.price,
    image: item.image,
    category: item.category,
    brand: item.brand ?? null,
    quantity: item.quantity,
  }));

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .insert(itemRows)
    .select("*");

  if (itemsError) {
    // Compensating delete — don't leave a "pending" order with no items behind.
    await supabase.from("orders").delete().eq("id", order.id);
    throw itemsError;
  }

  return {
    ...(order as OrderRecord),
    customer: null,
    items: (items ?? []) as OrderItemRecord[],
  };
}

const RETRY_WINDOW_MS = 30 * 60 * 1000;

function itemSetsMatch(existing: OrderItemRecord[], incoming: CreateOrderItemInput[]): boolean {
  if (existing.length !== incoming.length) return false;
  const key = (productId: number, price: number, quantity: number) => `${productId}:${price}:${quantity}`;
  const existingKeys = existing
    .map((i) => key(i.product_id, Number(i.price), i.quantity))
    .sort();
  const incomingKeys = incoming
    .map((i) => key(i.productId, i.price, i.quantity))
    .sort();
  return existingKeys.every((k, idx) => k === incomingKeys[idx]);
}

/**
 * Finds a still-pending order placed by this email in the last 30 minutes
 * with the exact same cart contents — a double-click or a reload-and-resubmit
 * of the same checkout, not a deliberate new purchase. Used to avoid creating
 * duplicate orders/payments on retry (see processCheckout).
 */
export async function findRecentPendingOrderForRetry(input: {
  email: string;
  items: CreateOrderItemInput[];
}): Promise<OrderWithDetails | null> {
  const supabase = getSupabaseAdmin();

  const { data: customers, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("email", input.email);
  if (customerError) throw customerError;

  const customerIds = (customers ?? []).map((c) => (c as { id: string }).id);
  if (customerIds.length === 0) return null;

  const since = new Date(Date.now() - RETRY_WINDOW_MS).toISOString();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .in("customer_id", customerIds)
    .eq("status", "pending")
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  if (error) throw error;

  for (const order of (orders ?? []) as OrderRecord[]) {
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);
    if (itemsError) throw itemsError;

    if (itemSetsMatch(items as OrderItemRecord[], input.items)) {
      return { ...order, customer: null, items: items as OrderItemRecord[] };
    }
  }

  return null;
}

export async function getOrderById(id: string): Promise<OrderWithDetails | null> {
  const supabase = getSupabaseAdmin();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!order) return null;

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id);

  if (itemsError) throw itemsError;

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", order.customer_id)
    .maybeSingle();

  if (customerError) throw customerError;

  return {
    ...(order as OrderRecord),
    customer: (customer as CustomerRecord | null) ?? null,
    items: (items ?? []) as OrderItemRecord[],
  };
}

/**
 * Looks up orders by the 8-hex-char prefix customers see as their order
 * reference (see order-ref.ts). Usually returns exactly one order; can
 * return more than one on a (rare, ~1-in-4-billion-per-pair) prefix
 * collision, which callers should resolve with a secondary check (e.g.
 * matching email) rather than ever exposing multiple orders to an
 * anonymous lookup.
 */
export async function findOrdersByReferencePrefix(
  prefix: string
): Promise<OrderWithDetails[]> {
  const supabase = getSupabaseAdmin();

  // Uses the find_orders_by_reference_prefix() SQL function (see migration
  // 009) so the lookup goes through the functional index on orders instead
  // of scanning every order into app memory.
  const { data: orders, error } = await supabase.rpc("find_orders_by_reference_prefix", {
    prefix,
  });

  if (error) throw error;

  const results = await Promise.all(
    ((orders ?? []) as OrderRecord[]).map(async (order) => {
      const [{ data: items, error: itemsError }, { data: customer, error: customerError }] =
        await Promise.all([
          supabase.from("order_items").select("*").eq("order_id", order.id),
          supabase.from("customers").select("*").eq("id", order.customer_id).maybeSingle(),
        ]);

      if (itemsError) throw itemsError;
      if (customerError) throw customerError;

      return {
        ...order,
        customer: (customer as CustomerRecord | null) ?? null,
        items: (items ?? []) as OrderItemRecord[],
      };
    })
  );

  return results;
}

export async function finalizeOrderPaid(id: string): Promise<OrderRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      processing_status: "payment_confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .in("status", ["pending", "processing"])
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (data as OrderRecord | null) ?? null;
}

export async function updateOrderControlStatus(
  orderId: string,
  newStatus: ControlStatus
): Promise<OrderRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .update({ control_status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (data as OrderRecord | null) ?? null;
}

export async function updateOrderProcessingStatus(
  orderId: string,
  newStatus: ProcessingStatus
): Promise<OrderRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .update({ processing_status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (data as OrderRecord | null) ?? null;
}

export async function updateOrderShippingStatus(
  orderId: string,
  newStatus: ShippingStatus
): Promise<OrderRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .update({ shipping_status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (data as OrderRecord | null) ?? null;
}

export type AdminOrderSummary = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: OrderStatus;
  control_status: ControlStatus;
  processing_status: ProcessingStatus;
  shipping_status: ShippingStatus;
  created_at: string;
};

export async function getAllOrdersForAdmin(): Promise<AdminOrderSummary[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, total, status, control_status, processing_status, shipping_status, created_at, customer:customers(full_name, email)"
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    id: string;
    total: number;
    status: OrderStatus;
    control_status: ControlStatus;
    processing_status: ProcessingStatus;
    shipping_status: ShippingStatus;
    created_at: string;
    customer: { full_name: string; email: string } | null;
  }>).map((o) => ({
    id: o.id,
    order_number: formatOrderReference(o.id),
    customer_name: o.customer?.full_name ?? "Unknown",
    customer_email: o.customer?.email ?? "",
    total: Number(o.total),
    status: o.status,
    control_status: o.control_status,
    processing_status: o.processing_status,
    shipping_status: o.shipping_status,
    created_at: o.created_at,
  }));
}

export async function failOrderIfUnpaid(id: string): Promise<OrderRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["pending", "processing"])
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (data as OrderRecord | null) ?? null;
}
