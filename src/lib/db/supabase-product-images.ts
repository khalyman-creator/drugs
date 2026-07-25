import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { ProductImage } from "@/lib/types";

function sortImages(images: ProductImage[]): ProductImage[] {
  return [...images].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}

export async function getImagesForProduct(productId: number): Promise<ProductImage[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId);

  if (error) throw error;
  return sortImages((data ?? []) as ProductImage[]);
}

export async function getImagesForProducts(
  productIds: number[]
): Promise<Map<number, ProductImage[]>> {
  const map = new Map<number, ProductImage[]>();
  if (productIds.length === 0) return map;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .in("product_id", productIds);

  if (error) throw error;

  for (const row of (data ?? []) as ProductImage[]) {
    const existing = map.get(row.product_id);
    if (existing) existing.push(row);
    else map.set(row.product_id, [row]);
  }

  for (const [productId, images] of map) {
    map.set(productId, sortImages(images));
  }

  return map;
}

export async function replaceImagesForProduct(
  productId: number,
  imageUrls: string[]
): Promise<ProductImage[]> {
  const supabase = getSupabaseAdmin();

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);
  if (deleteError) throw deleteError;

  const urls = imageUrls.filter((u) => u.trim());
  if (urls.length === 0) return [];

  const rows = urls.map((url, index) => ({
    product_id: productId,
    image_url: url,
    sort_order: index,
  }));

  const { data, error: insertError } = await supabase
    .from("product_images")
    .insert(rows)
    .select("*");
  if (insertError) throw insertError;

  return sortImages((data ?? []) as ProductImage[]);
}
