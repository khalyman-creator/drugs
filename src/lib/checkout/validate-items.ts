import { getProductById } from "@/lib/db/supabase-products";
import { getSectionById } from "@/lib/db/supabase-sections";
import { getPricingOptionsForProduct } from "@/lib/db/supabase-pricing-options";
import type { CreateOrderItemInput } from "@/lib/db/supabase-orders";
import type { Product } from "@/lib/types";
import {
  formatVariantLineName,
  getActiveOptions,
  getPricingMode,
  recalculateLinePrice,
} from "@/lib/pricing";

export type RawCheckoutItem = {
  productId: number;
  quantity: number;
  variantLabel?: string;
};

export function parseRawCheckoutItems(raw: unknown): RawCheckoutItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const items: RawCheckoutItem[] = [];

  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) return null;

    const productId =
      typeof (entry as { productId?: number }).productId === "number"
        ? (entry as { productId: number }).productId
        : typeof (entry as { product_id?: number }).product_id === "number"
          ? (entry as { product_id: number }).product_id
          : null;

    const quantity =
      typeof (entry as { quantity?: number }).quantity === "number"
        ? (entry as { quantity: number }).quantity
        : 1;

    if (productId == null || quantity < 1 || quantity > 99) {
      return null;
    }

    const variantLabel =
      typeof (entry as { variantLabel?: string }).variantLabel === "string"
        ? (entry as { variantLabel: string }).variantLabel
        : undefined;

    items.push({ productId, quantity, variantLabel });
  }

  return items;
}

// Server-side trusted price resolution — never trust a price the client
// sends directly. Re-derives it from the product's own active pricing
// options (or its base price, for standard-mode products).
async function resolveVariantPrice(
  product: Product,
  item: RawCheckoutItem
): Promise<{ variantLabel: string; unitPrice: number }> {
  const mode = getPricingMode(product.section_id);

  if (mode === "standard") {
    return {
      variantLabel: item.variantLabel ?? `${item.quantity} unit(s)`,
      unitPrice: product.price,
    };
  }

  const options = await getPricingOptionsForProduct(product.id);

  if (item.variantLabel) {
    return {
      variantLabel: item.variantLabel,
      unitPrice: recalculateLinePrice(item.variantLabel, options, product.allow_custom_quantity),
    };
  }

  const active = getActiveOptions(options);
  if (active.length === 0) {
    throw new Error(`Product ${product.id} is no longer available`);
  }
  return { variantLabel: active[0].label, unitPrice: active[0].price };
}

export async function lockOrderItemsFromCatalog(
  rawItems: RawCheckoutItem[]
): Promise<CreateOrderItemInput[]> {
  const locked: CreateOrderItemInput[] = [];

  for (const item of rawItems) {
    const product = await getProductById(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} is no longer available`);
    }

    const section = await getSectionById(product.section_id);
    if (!product.is_active || !section?.is_active) {
      throw new Error(`Product ${item.productId} is no longer available`);
    }

    let variantLabel: string;
    let unitPrice: number;
    try {
      ({ variantLabel, unitPrice } = await resolveVariantPrice(product, item));
    } catch {
      throw new Error(`Product ${item.productId} is no longer available`);
    }

    locked.push({
      productId: product.id,
      name: formatVariantLineName(product.name, variantLabel),
      price: unitPrice,
      image: product.image_url,
      category: section?.name ?? "General",
      quantity: item.quantity,
    });
  }

  return locked;
}
