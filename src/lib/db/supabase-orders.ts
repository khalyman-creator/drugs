import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatOrderReference } from "@/lib/email/order-ref";
import type { CustomerRecord } from "./supabase-customers";

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

  if (itemsError) throw itemsError;

  return {
    ...(order as OrderRecord),
    customer: null,
    items: (items ?? []) as OrderItemRecord[],
  };
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

export async function finalizeOrderPaid(id: string): Promise<OrderRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["pending", "processing"])
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
  created_at: string;
};

export async function getAllOrdersForAdmin(): Promise<AdminOrderSummary[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("id, total, status, created_at, customer:customers(full_name, email)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    id: string;
    total: number;
    status: OrderStatus;
    created_at: string;
    customer: { full_name: string; email: string } | null;
  }>).map((o) => ({
    id: o.id,
    order_number: formatOrderReference(o.id),
    customer_name: o.customer?.full_name ?? "Unknown",
    customer_email: o.customer?.email ?? "",
    total: Number(o.total),
    status: o.status,
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
