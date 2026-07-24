"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import {
  getActiveOptions,
  getPricingMode,
  hasCustomQuantitySupport,
  priceFromCustomQuantity,
  resolvePricingSelection,
  clampGrams,
  clampButtons,
  GRAM_MIN,
  BUTTON_MIN,
} from "@/lib/pricing";
import type { ProductPricingOption } from "@/lib/types";
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
  pricingOptions: ProductPricingOption[];
  allowCustomQuantity: boolean;
  onChange: (selection: SectionSelection) => void;
};

export function SectionQuantityPicker({
  sectionId,
  productId,
  basePrice = 200,
  pricingOptions,
  allowCustomQuantity,
  onChange,
}: Props) {
  const mode = getPricingMode(sectionId);
  const activeOptions = useMemo(() => getActiveOptions(pricingOptions), [pricingOptions]);
  const canUseCustom = allowCustomQuantity && hasCustomQuantitySupport(pricingOptions);
  const unitMin = mode === "button" ? BUTTON_MIN : GRAM_MIN;

  const [selectedId, setSelectedId] = useState<number | "custom">(activeOptions[0]?.id ?? "custom");
  const [customQty, setCustomQty] = useState(unitMin);
  const [standardQty, setStandardQty] = useState(1);

  const selection = useMemo((): SectionSelection => {
    if (mode === "standard") {
      return {
        variantLabel: `${standardQty} unit${standardQty === 1 ? "" : "s"}`,
        price: basePrice,
        quantity: standardQty,
      };
    }

    if (activeOptions.length === 0) {
      return { variantLabel: "Unavailable", price: 0, quantity: 0 };
    }

    return resolvePricingSelection(selectedId, pricingOptions, mode, customQty);
  }, [mode, selectedId, customQty, standardQty, basePrice, activeOptions.length, pricingOptions]);

  useEffect(() => {
    onChange(selection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  if (mode === "standard") {
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

  if (activeOptions.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        This product&apos;s pricing options are currently unavailable.
      </div>
    );
  }

  const unitLabel = mode === "button" ? "buttons" : "grams";
  const cheapest = activeOptions[0];
  const priciest = activeOptions[activeOptions.length - 1];

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <label
        htmlFor={`qty-${productId}`}
        className="text-sm font-semibold uppercase tracking-wide text-gray-700"
      >
        Quantity ({unitLabel})
      </label>
      <p className="mt-0.5 text-xs text-gray-500">
        {cheapest.label} from {formatPrice(cheapest.price)}
        {priciest.id !== cheapest.id && (
          <> · {priciest.label} {formatPrice(priciest.price)}</>
        )}
      </p>

      <div className="relative mt-3">
        <select
          id={`qty-${productId}`}
          value={String(selectedId)}
          onChange={(e) => {
            const v = e.target.value;
            setSelectedId(v === "custom" ? "custom" : Number(v));
          }}
          className="w-full appearance-none rounded-lg border-2 border-gray-300 bg-white py-3 pl-4 pr-10 text-sm font-medium text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {activeOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label} — {formatPrice(opt.price)}
            </option>
          ))}
          {canUseCustom && <option value="custom">Custom ({unitLabel})</option>}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
      </div>

      {selectedId === "custom" && canUseCustom && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            {mode === "button" ? "Buttons" : "Grams"}
          </label>
          <input
            type="number"
            min={unitMin}
            max={9999}
            step={1}
            value={customQty}
            onChange={(e) => {
              const parsed = Number.parseInt(e.target.value, 10);
              if (Number.isNaN(parsed)) return;
              setCustomQty(mode === "button" ? clampButtons(parsed) : clampGrams(parsed));
            }}
            onBlur={() =>
              setCustomQty((q) => (mode === "button" ? clampButtons(q) : clampGrams(q)))
            }
            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold"
          />
          <span className="text-xs text-gray-500">
            Minimum {unitMin}
            {mode === "gram" ? "g" : ""} — {formatPrice(priceFromCustomQuantity(unitMin, pricingOptions))}+
          </span>
        </div>
      )}

      <p className="mt-4 border-t border-gray-200 pt-3 text-base font-bold text-brand-700">
        Total: {formatPrice(selection.price)}
      </p>
    </div>
  );
}
