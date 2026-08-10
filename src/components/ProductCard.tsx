"use client";

import Link from "next/link";
import { useState } from "react";
import { makeLineKey } from "@/lib/cart";
import {
  formatVariantLineName,
  getActiveOptions,
  getDisplayFromPrice,
  getPricingMode,
} from "@/lib/pricing";
import { NEW_ARRIVAL_DAYS } from "@/lib/design-tokens";
import type { Product, ProductPricingOption } from "@/lib/types";
import { useCart } from "./CartProvider";
import { PriceDisplay } from "./PriceDisplay";

function isNewArrival(createdAt: string): boolean {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs <= NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000;
}

export function ProductCard({
  product,
  pricingOptions,
  sectionName,
}: {
  product: Product;
  pricingOptions: ProductPricingOption[];
  sectionName?: string;
}) {
  const { addItem, hydrated } = useCart();
  const [added, setAdded] = useState(false);

  const mode = getPricingMode(product.section_id);
  const activeOptions = getActiveOptions(pricingOptions);
  const displayPrice =
    mode === "standard" ? product.price : getDisplayFromPrice(pricingOptions, product.price);
  const canAdd = hydrated && (mode === "standard" || activeOptions.length > 0);

  // Sale pricing only applies to flat-priced products — tiered (gram/button)
  // products don't have a single price to discount against.
  const onSale = mode === "standard" && product.sale_price != null && product.sale_price < product.price;
  // The price actually charged — mirrors the server-side resolution in
  // validate-items.ts so the cart never shows a different price than checkout.
  const effectivePrice = onSale ? product.sale_price! : displayPrice;
  const isNew = isNewArrival(product.created_at);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!canAdd) return;

    const variantLabel = mode === "standard" ? "1 unit" : activeOptions[0].label;
    const price = mode === "standard" ? effectivePrice : activeOptions[0].price;

    addItem({
      lineKey: makeLineKey(product.id, variantLabel),
      product_id: product.id,
      slug: product.slug,
      name: formatVariantLineName(product.name, variantLabel),
      price,
      image_url: product.image_url,
      variant_label: variantLabel,
      section_id: product.section_id,
      quantity: 1,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="card-surface group overflow-hidden hover:-translate-y-1 hover:shadow-pop-brand">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {(onSale || isNew) && (
            <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
              {onSale && <span className="badge badge-sale">Sale</span>}
              {isNew && <span className="badge badge-new">New</span>}
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </div>
        <div className="border-t-2 border-gray-900 p-4">
          {sectionName && (
            <p className="mb-1 truncate text-[11px] font-bold uppercase tracking-wide text-gray-400">
              {sectionName}
            </p>
          )}
          <h3 className="truncate font-semibold text-gray-900 group-hover:text-brand-600">
            {product.name}
          </h3>
          <div className="mt-2">
            <PriceDisplay price={onSale ? product.price : displayPrice} salePrice={onSale ? product.sale_price : null} />
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAdd}
          className="focus-ring w-full rounded-sm border-2 border-gray-900 bg-gray-900 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {added ? "✓ Added" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
