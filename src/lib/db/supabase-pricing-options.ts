import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { ProductPricingOption } from "@/lib/types";

function sortOptions(options: ProductPricingOption[]): ProductPricingOption[] {
  return [...options].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}

export async function getPricingOptionsForProduct(
  productId: number
): Promise<ProductPricingOption[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("product_pricing_options")
    .select("*")
    .eq("product_id", productId);

  if (error) throw error;
  return sortOptions((data ?? []) as ProductPricingOption[]);
}

export async function getPricingOptionsForProducts(
  productIds: number[]
): Promise<Map<number, ProductPricingOption[]>> {
  const map = new Map<number, ProductPricingOption[]>();
  if (productIds.length === 0) return map;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("product_pricing_options")
    .select("*")
    .in("product_id", productIds);

  if (error) throw error;

  for (const row of (data ?? []) as ProductPricingOption[]) {
    const existing = map.get(row.product_id);
    if (existing) existing.push(row);
    else map.set(row.product_id, [row]);
  }

  for (const [productId, options] of map) {
    map.set(productId, sortOptions(options));
  }

  return map;
}

export async function replacePricingOptionsForProduct(
  productId: number,
  options: {
    label: string;
    price: number;
    unit_quantity?: number | null;
    is_active: boolean;
  }[]
): Promise<ProductPricingOption[]> {
  const supabase = getSupabaseAdmin();

  const { error: deleteError } = await supabase
    .from("product_pricing_options")
    .delete()
    .eq("product_id", productId);
  if (deleteError) throw deleteError;

  if (options.length === 0) return [];

  const rows = options.map((o, index) => ({
    product_id: productId,
    label: o.label,
    price: o.price,
    unit_quantity: o.unit_quantity ?? null,
    is_active: o.is_active,
    sort_order: index,
  }));

  const { data, error: insertError } = await supabase
    .from("product_pricing_options")
    .insert(rows)
    .select("*");
  if (insertError) throw insertError;

  return sortOptions((data ?? []) as ProductPricingOption[]);
}
