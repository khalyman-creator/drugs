import type { ProductPricingOption } from "@/lib/types";

export type PricingMode = "gram" | "button" | "standard";

export const GRAM_MIN = 28;
export const BUTTON_MIN = 8;

export function getPricingMode(sectionId: number): PricingMode {
  if (sectionId >= 1 && sectionId <= 6) return "gram";
  if (sectionId >= 7 && sectionId <= 8) return "button";
  return "standard";
}

export function getActiveOptions(options: ProductPricingOption[]): ProductPricingOption[] {
  return options
    .filter((o) => o.is_active)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}

export function clampGrams(grams: number): number {
  const g = Math.floor(grams);
  if (!Number.isFinite(g)) return GRAM_MIN;
  return Math.min(9999, Math.max(GRAM_MIN, g));
}

export function clampButtons(buttons: number): number {
  const b = Math.floor(buttons);
  if (!Number.isFinite(b)) return BUTTON_MIN;
  return Math.min(9999, Math.max(1, b));
}

// The "custom amount" rate is anchored on the cheapest active option that
// declares a unit_quantity (e.g. the smallest gram/button tier).
function findRateAnchor(options: ProductPricingOption[]): ProductPricingOption | null {
  const withUnit = getActiveOptions(options).filter(
    (o) => o.unit_quantity != null && o.unit_quantity > 0
  );
  if (withUnit.length === 0) return null;
  return withUnit.reduce((min, o) => (o.price < min.price ? o : min), withUnit[0]);
}

export function hasCustomQuantitySupport(options: ProductPricingOption[]): boolean {
  return findRateAnchor(options) != null;
}

export function priceFromCustomQuantity(quantity: number, options: ProductPricingOption[]): number {
  const anchor = findRateAnchor(options);
  if (!anchor) throw new Error("No pricing tier available to compute a custom price from");
  const perUnit = anchor.price / anchor.unit_quantity!;
  return Math.round(quantity * perUnit);
}

export type PricingSelection = {
  variantLabel: string;
  price: number;
  quantity: number;
};

export function resolvePricingSelection(
  optionId: number | "custom",
  options: ProductPricingOption[],
  mode: "gram" | "button",
  customQuantity?: number
): PricingSelection {
  if (optionId === "custom") {
    const min = mode === "button" ? BUTTON_MIN : GRAM_MIN;
    const qty =
      mode === "button" ? clampButtons(customQuantity ?? min) : clampGrams(customQuantity ?? min);
    const price = priceFromCustomQuantity(qty, options);
    return {
      variantLabel: mode === "button" ? `${qty} buttons (custom)` : `${qty}g (custom)`,
      price,
      quantity: 1,
    };
  }

  const option = getActiveOptions(options).find((o) => o.id === optionId);
  if (!option) throw new Error("Invalid pricing option");
  return { variantLabel: option.label, price: option.price, quantity: 1 };
}

export function getDisplayFromPrice(options: ProductPricingOption[], fallback: number): number {
  const active = getActiveOptions(options);
  if (active.length === 0) return fallback;
  return Math.min(...active.map((o) => o.price));
}

export function formatVariantLineName(productName: string, variantLabel?: string) {
  if (!variantLabel) return productName;
  return `${productName} — ${variantLabel}`;
}

const CUSTOM_GRAMS_RE = /^(\d+)g \(custom\)$/;
const CUSTOM_BUTTONS_RE = /^(\d+) buttons \(custom\)$/;

// Server-side trusted re-derivation of price from a variant label — checkout
// must never trust a price the client sends directly.
export function recalculateLinePrice(
  variantLabel: string,
  options: ProductPricingOption[],
  allowCustomQuantity: boolean
): number {
  const active = getActiveOptions(options);
  const preset = active.find((o) => o.label === variantLabel);
  if (preset) return preset.price;

  if (allowCustomQuantity) {
    const gramMatch = variantLabel.match(CUSTOM_GRAMS_RE);
    if (gramMatch) {
      return priceFromCustomQuantity(clampGrams(Number.parseInt(gramMatch[1], 10)), options);
    }

    const buttonMatch = variantLabel.match(CUSTOM_BUTTONS_RE);
    if (buttonMatch) {
      return priceFromCustomQuantity(clampButtons(Number.parseInt(buttonMatch[1], 10)), options);
    }
  }

  throw new Error("Invalid variant for this product");
}
