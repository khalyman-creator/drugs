"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import {
  BUTTON_OPTIONS,
  GRAM_OPTIONS,
  type ButtonOptionId,
  type GramOptionId,
  getPricingMode,
  priceFromCustomButtons,
  priceFromCustomGrams,
  GRAM_MIN,
  GRAM_PRICE_28,
  resolveButtonSelection,
  resolveGramSelection,
  clampGrams,
} from "@/lib/pricing";
import { QuantitySelector } from "./QuantitySelector";

export type SectionSelection = {
  variantLabel: string;
  price: number;
  quantity: number;
};

type Props = {
  sectionId: number;
  productId: number;
  basePrice?: number;
  onChange: (selection: SectionSelection) => void;
};

export function SectionQuantityPicker({ sectionId, productId, basePrice = 200, onChange }: Props) {
  const mode = getPricingMode(sectionId);

  const [gramOption, setGramOption] = useState<GramOptionId>("28g");
  const [customGrams, setCustomGrams] = useState(GRAM_MIN);
  const [buttonOption, setButtonOption] = useState<ButtonOptionId>("8");
  const [customButtons, setCustomButtons] = useState(8);
  const [standardQty, setStandardQty] = useState(1);

  const selection = useMemo((): SectionSelection => {
    if (mode === "gram") {
      const resolved = resolveGramSelection(gramOption, customGrams);
      return { ...resolved, quantity: 1 };
    }
    if (mode === "button") {
      const resolved = resolveButtonSelection(buttonOption, customButtons);
      return { ...resolved, quantity: 1 };
    }
    return {
      variantLabel: `${standardQty} unit${standardQty === 1 ? "" : "s"}`,
      price: basePrice,
      quantity: standardQty,
    };
  }, [mode, gramOption, customGrams, buttonOption, customButtons, standardQty, basePrice]);

  useEffect(() => {
    onChange(selection);
  }, [selection, onChange]);

  if (mode === "gram") {
    const preview =
      gramOption === "custom"
        ? priceFromCustomGrams(customGrams)
        : (GRAM_OPTIONS.find((o) => o.id === gramOption)?.price ?? GRAM_PRICE_28);

    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <label htmlFor={`gram-qty-${productId}`} className="text-sm font-semibold uppercase tracking-wide text-gray-700">
          Quantity (grams)
        </label>
        <p className="mt-0.5 text-xs text-gray-500">28g from {formatPrice(200)} · 1 lb {formatPrice(1000)}</p>

        <div className="relative mt-3">
          <select
            id={`gram-qty-${productId}`}
            value={gramOption}
            onChange={(e) => setGramOption(e.target.value as GramOptionId)}
            className="w-full appearance-none rounded-lg border-2 border-gray-300 bg-white py-3 pl-4 pr-10 text-sm font-medium text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {GRAM_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.id === "custom"
                  ? opt.label
                  : `${opt.label} — ${formatPrice(opt.price!)}`}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
        </div>

        {gramOption === "custom" && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Grams</label>
            <input
              type="number"
              min={GRAM_MIN}
              max={9999}
              step={1}
              value={customGrams}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                if (Number.isNaN(parsed)) return;
                setCustomGrams(clampGrams(parsed));
              }}
              onBlur={() => setCustomGrams((g) => clampGrams(g))}
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold"
            />
            <span className="text-xs text-gray-500">Minimum {GRAM_MIN}g — {formatPrice(GRAM_PRICE_28)}+</span>
          </div>
        )}

        <p className="mt-4 border-t border-gray-200 pt-3 text-base font-bold text-brand-700">
          Total: {formatPrice(preview)}
        </p>
      </div>
    );
  }

  if (mode === "button") {
    const preview =
      buttonOption === "custom"
        ? priceFromCustomButtons(customButtons)
        : (BUTTON_OPTIONS.find((o) => o.id === buttonOption)?.price ?? 150);

    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <label htmlFor={`btn-qty-${productId}`} className="text-sm font-semibold uppercase tracking-wide text-gray-700">
          Quantity (buttons)
        </label>
        <p className="mt-0.5 text-xs text-gray-500">8 buttons from {formatPrice(150)} · 64 buttons {formatPrice(1000)}</p>

        <div className="relative mt-3">
          <select
            id={`btn-qty-${productId}`}
            value={buttonOption}
            onChange={(e) => setButtonOption(e.target.value as ButtonOptionId)}
            className="w-full appearance-none rounded-lg border-2 border-gray-300 bg-white py-3 pl-4 pr-10 text-sm font-medium text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {BUTTON_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.id === "custom"
                  ? opt.label
                  : `${opt.label} — ${formatPrice(opt.price!)}`}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
        </div>

        {buttonOption === "custom" && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Buttons</label>
            <input
              type="number"
              min={1}
              max={9999}
              value={customButtons}
              onChange={(e) => setCustomButtons(Number.parseInt(e.target.value, 10) || 8)}
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold"
            />
            <span className="text-xs text-gray-500">Min 8 = {formatPrice(150)}</span>
          </div>
        )}

        <p className="mt-4 border-t border-gray-200 pt-3 text-base font-bold text-brand-700">
          Total: {formatPrice(preview)}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wide text-gray-700">Quantity</span>
        </div>
        <QuantitySelector value={standardQty} onChange={setStandardQty} size="md" />
      </div>
      <p className="mt-3 border-t border-gray-200 pt-3 text-sm text-gray-600">
        Subtotal:{" "}
        <span className="font-bold text-brand-700">{formatPrice(basePrice * standardQty)}</span>
      </p>
    </div>
  );
}
