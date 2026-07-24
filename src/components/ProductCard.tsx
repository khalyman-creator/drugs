"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { makeLineKey } from "@/lib/cart";
import {
  formatVariantLineName,
  getActiveOptions,
  getDisplayFromPrice,
  getPricingMode,
} from "@/lib/pricing";
import type { Product, ProductPricingOption } from "@/lib/types";
import { useCart } from "./CartProvider";

export function ProductCard({
  product,
  pricingOptions,
}: {
  product: Product;
  pricingOptions: ProductPricingOption[];
}) {
  const { addItem, hydrated } = useCart();
  const [added, setAdded] = useState(false);

  const mode = getPricingMode(product.section_id);
  const activeOptions = getActiveOptions(pricingOptions);
  const displayPrice =
    mode === "standard" ? product.price : getDisplayFromPrice(pricingOptions, product.price);
  const canAdd = hydrated && (mode === "standard" || activeOptions.length > 0);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!canAdd) return;

    const variantLabel = mode === "standard" ? "1 unit" : activeOptions[0].label;
    const price = mode === "standard" ? product.price : activeOptions[0].price;

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
    <div className="group overflow-hidden rounded-sm border-2 border-gray-900 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(220,38,38,1)]">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
            <span className="font-display rounded-sm bg-white px-4 py-2 text-xs uppercase tracking-wide text-gray-900">
              Quick View
            </span>
          </span>
        </div>
        <div className="border-t-2 border-gray-900 p-4">
          <h3 className="font-semibold text-gray-900 group-hover:text-brand-600">{product.name}</h3>
          <p className="font-display mt-2 text-lg text-brand-600">{formatPrice(displayPrice)}</p>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAdd}
          className="w-full rounded-sm border-2 border-gray-900 bg-gray-900 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:border-brand-600 hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {added ? "✓ Added" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
