import { getProductById } from "@/lib/db/supabase-products";
import { getSectionById } from "@/lib/db/supabase-sections";
import type { CreateOrderItemInput } from "@/lib/db/supabase-orders";
import {
  formatVariantLineName,
  getPricingMode,
  recalculateLinePrice,
  resolveButtonSelection,
  resolveGramSelection,
  type ButtonOptionId,
  type GramOptionId,
} from "@/lib/pricing";

export type RawCheckoutItem = {
  productId: number;
  quantity: number;
  variantLabel?: string;
  gramOption?: GramOptionId;
  customGrams?: number;
  buttonOption?: ButtonOptionId;
  customButtons?: number;
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

    items.push({
      productId,
      quantity,
      variantLabel,
      gramOption: (entry as { gramOption?: GramOptionId }).gramOption,
      customGrams: (entry as { customGrams?: number }).customGrams,
      buttonOption: (entry as { buttonOption?: ButtonOptionId }).buttonOption,
      customButtons: (entry as { customButtons?: number }).customButtons,
    });
  }

  return items;
}

async function resolveVariantPrice(
  sectionId: number,
  item: RawCheckoutItem
): Promise<{ variantLabel: string; unitPrice: number }> {
  const mode = getPricingMode(sectionId);

  if (mode === "gram") {
    if (item.gramOption) {
      const resolved = resolveGramSelection(item.gramOption, item.customGrams);
      return { variantLabel: resolved.variantLabel, unitPrice: resolved.price };
    }
    if (item.variantLabel) {
      return {
        variantLabel: item.variantLabel,
        unitPrice: recalculateLinePrice({
          sectionId,
          variantLabel: item.variantLabel,
          quantity: 1,
        }),
      };
    }
    const resolved = resolveGramSelection("28g");
    return { variantLabel: resolved.variantLabel, unitPrice: resolved.price };
  }

  if (mode === "button") {
    if (item.buttonOption) {
      const resolved = resolveButtonSelection(item.buttonOption, item.customButtons);
      return { variantLabel: resolved.variantLabel, unitPrice: resolved.price };
    }
    if (item.variantLabel) {
      return {
        variantLabel: item.variantLabel,
        unitPrice: recalculateLinePrice({
          sectionId,
          variantLabel: item.variantLabel,
          quantity: 1,
        }),
      };
    }
    const resolved = resolveButtonSelection("8");
    return { variantLabel: resolved.variantLabel, unitPrice: resolved.price };
  }

  const product = await getProductById(item.productId);
  return {
    variantLabel: item.variantLabel ?? `${item.quantity} unit(s)`,
    unitPrice: product!.price,
  };
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
    const { variantLabel, unitPrice } = await resolveVariantPrice(product.section_id, item);

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
