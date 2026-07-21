export type PricingMode = "gram" | "button" | "standard";

export type GramOptionId = "28g" | "1/4p" | "1/2p" | "1p" | "custom";
export type ButtonOptionId = "8" | "16" | "32" | "64" | "custom";

export type GramOption = {
  id: GramOptionId;
  label: string;
  grams: number | null;
  price: number | null;
};

export type ButtonOption = {
  id: ButtonOptionId;
  label: string;
  buttons: number | null;
  price: number | null;
};

export const GRAM_PRICE_28 = 200;
export const GRAM_MIN = 28;
export const GRAM_PRICE_PER_GRAM = GRAM_PRICE_28 / GRAM_MIN;
export const BUTTON_PRICE_8 = 150;
export const BUTTON_PRICE_PER = BUTTON_PRICE_8 / 8;

export const GRAM_OPTIONS: GramOption[] = [
  { id: "28g", label: "28g", grams: 28, price: 200 },
  { id: "1/4p", label: "1/4 lb (113g)", grams: 113, price: 250 },
  { id: "1/2p", label: "1/2 lb (227g)", grams: 227, price: 500 },
  { id: "1p", label: "1 lb (454g)", grams: 454, price: 1000 },
  { id: "custom", label: "Custom (grams)", grams: null, price: null },
];

export const BUTTON_OPTIONS: ButtonOption[] = [
  { id: "8", label: "8 buttons", buttons: 8, price: 150 },
  { id: "16", label: "16 buttons", buttons: 16, price: 280 },
  { id: "32", label: "32 buttons", buttons: 32, price: 540 },
  { id: "64", label: "64 buttons", buttons: 64, price: 1000 },
  { id: "custom", label: "Custom (buttons)", buttons: null, price: null },
];

export function getPricingMode(sectionId: number): PricingMode {
  if (sectionId >= 1 && sectionId <= 6) return "gram";
  if (sectionId >= 7 && sectionId <= 8) return "button";
  return "standard";
}

export function clampGrams(grams: number): number {
  const g = Math.floor(grams);
  if (!Number.isFinite(g)) return GRAM_MIN;
  return Math.min(9999, Math.max(GRAM_MIN, g));
}

export function priceFromCustomGrams(grams: number): number {
  const g = clampGrams(grams);
  return Math.round(g * GRAM_PRICE_PER_GRAM);
}

export function priceFromCustomButtons(buttons: number): number {
  const b = Math.max(1, Math.floor(buttons));
  if (b < 8) return BUTTON_PRICE_8;
  return Math.round(b * BUTTON_PRICE_PER);
}

export function resolveGramSelection(optionId: GramOptionId, customGrams?: number) {
  const preset = GRAM_OPTIONS.find((o) => o.id === optionId);
  if (!preset) throw new Error("Invalid gram option");

  if (optionId === "custom") {
    const grams = clampGrams(customGrams ?? GRAM_MIN);
    const price = priceFromCustomGrams(grams);
    return {
      variantLabel: `${grams}g (custom)`,
      price,
      quantity: 1,
    };
  }

  return {
    variantLabel: preset.label,
    price: preset.price!,
    quantity: 1,
  };
}

export function resolveButtonSelection(optionId: ButtonOptionId, customButtons?: number) {
  const preset = BUTTON_OPTIONS.find((o) => o.id === optionId);
  if (!preset) throw new Error("Invalid button option");

  if (optionId === "custom") {
    const buttons = Math.max(1, Math.floor(customButtons ?? 8));
    const price = priceFromCustomButtons(buttons);
    return {
      variantLabel: `${buttons} buttons (custom)`,
      price,
      quantity: 1,
    };
  }

  return {
    variantLabel: preset.label,
    price: preset.price!,
    quantity: 1,
  };
}

export function getDisplayFromPrice(sectionId: number): number {
  const mode = getPricingMode(sectionId);
  if (mode === "gram") return GRAM_PRICE_28;
  if (mode === "button") return BUTTON_PRICE_8;
  return 200;
}

export function formatVariantLineName(productName: string, variantLabel?: string) {
  if (!variantLabel) return productName;
  return `${productName} — ${variantLabel}`;
}

export function recalculateLinePrice(input: {
  sectionId: number;
  variantLabel: string;
  quantity: number;
}): number {
  const mode = getPricingMode(input.sectionId);

  if (mode === "gram") {
    const preset = GRAM_OPTIONS.find((o) => o.label === input.variantLabel);
    if (preset?.price != null) return preset.price;

    const customMatch = input.variantLabel.match(/^(\d+)g \(custom\)$/);
    if (customMatch) {
      return priceFromCustomGrams(Number.parseInt(customMatch[1], 10));
    }
  }

  if (mode === "button") {
    const preset = BUTTON_OPTIONS.find((o) => o.label === input.variantLabel);
    if (preset?.price != null) return preset.price;

    const customMatch = input.variantLabel.match(/^(\d+) buttons \(custom\)$/);
    if (customMatch) {
      return priceFromCustomButtons(Number.parseInt(customMatch[1], 10));
    }
  }

  throw new Error("Invalid variant for this product");
}
