"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { makeLineKey } from "@/lib/cart";
import { formatVariantLineName, getDisplayFromPrice, getPricingMode } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { useCart } from "./CartProvider";
import { SectionQuantityPicker, type SectionSelection } from "./SectionQuantityPicker";

function AddToCartBlock({ product, sectionId }: { product: Product; sectionId: number }) {
  const { addItem, replaceCart, hydrated } = useCart();
  const router = useRouter();
  const mode = getPricingMode(sectionId);
  const [selection, setSelection] = useState<SectionSelection>(() => {
    if (mode === "button") {
      return { variantLabel: "8 buttons", price: 150, quantity: 1 };
    }
    if (mode === "gram") {
      return { variantLabel: "28g", price: 200, quantity: 1 };
    }
    return { variantLabel: "1 unit", price: product.price, quantity: 1 };
  });
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSelectionChange = useCallback((next: SectionSelection) => {
    setSelection(next);
  }, []);

  if (!hydrated) {
    return <div className="h-24 animate-pulse rounded-lg bg-gray-100" />;
  }

  function buildCartItem() {
    const lineKey = makeLineKey(product.id, selection.variantLabel);
    return {
      lineKey,
      product_id: product.id,
      slug: product.slug,
      name: formatVariantLineName(product.name, selection.variantLabel),
      price: selection.price,
      image_url: product.image_url,
      variant_label: selection.variantLabel,
      section_id: sectionId,
      quantity: selection.quantity,
    };
  }

  function handleAdd() {
    addItem(buildCartItem());
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  function handleBuyNow() {
    setLoading(true);
    replaceCart(buildCartItem());
    router.push("/checkout");
  }

  const lineTotal = selection.price * selection.quantity;

  return (
    <div className="space-y-4">
      <SectionQuantityPicker
        sectionId={sectionId}
        productId={product.id}
        basePrice={product.price}
        onChange={onSelectionChange}
      />

      <button
        type="button"
        onClick={handleAdd}
        className="w-full rounded-lg bg-brand-600 py-4 text-base font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-brand-700"
      >
        {added ? "✓ Added to Cart" : "Add to Cart"}
      </button>

      <button
        type="button"
        onClick={handleBuyNow}
        disabled={loading}
        className="w-full rounded-lg border-2 border-gray-800 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60"
      >
        Buy Now — {formatPrice(lineTotal)}
      </button>
    </div>
  );
}

export function ProductPageClient({
  product,
  sectionName,
}: {
  product: Product;
  sectionName: string;
}) {
  const sectionId = product.section_id;

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-brand-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-brand-600">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      {/* Main product layout — WooCommerce-style */}
      <div className="grid gap-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:grid-cols-2 lg:p-10">
        {/* Image */}
        <div className="relative overflow-hidden rounded-xl bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
          <span className="absolute left-4 top-4 rounded bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700 shadow">
            {sectionName}
          </span>
        </div>

        {/* Product summary */}
        <div className="flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            {sectionName}
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-gray-900 lg:text-4xl">
            {product.name}
          </h1>

          <p className="mt-5 text-4xl font-bold text-brand-700">
            {getPricingMode(sectionId) === "standard"
              ? formatPrice(product.price)
              : `From ${formatPrice(getDisplayFromPrice(sectionId))}`}
          </p>
          <p className="mt-1 text-sm text-gray-400">SKU: RD-{product.id}</p>

          <p className="mt-6 border-t border-gray-100 pt-6 text-gray-600 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-8">
            <AddToCartBlock product={product} sectionId={sectionId} />
          </div>

          <ul className="mt-8 space-y-2 border-t border-gray-100 pt-6 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="text-brand-600">✓</span> Secure checkout
            </li>
            <li className="flex items-center gap-2">
              <span className="text-brand-600">✓</span> BTC payment available at checkout
            </li>
          </ul>
        </div>
      </div>

      {/* Product Details */}
      <div className="mt-12 border-t border-gray-200 pt-8">
        <div className="max-w-3xl text-gray-600">
          <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
          <p className="mt-4 leading-relaxed">{product.description}</p>
          <ul className="mt-6 space-y-2 border-t border-gray-100 pt-6 text-sm">
            <li>
              <span className="font-medium text-gray-900">Category:</span> {sectionName}
            </li>
            <li>
              <span className="font-medium text-gray-900">SKU:</span> RD-{product.id}
            </li>
            <li>
              <span className="font-medium text-gray-900">Availability:</span> In stock
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
