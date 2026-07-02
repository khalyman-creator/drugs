"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { StarRating } from "./StarRating";
import type { Product } from "@/lib/types";
import type { ReviewSummary } from "@/lib/review-types";
import { useCart } from "./CartProvider";

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem, replaceCart, hydrated } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!hydrated) {
    return (
      <div className="flex gap-3">
        <div className="btn-outline flex-1 opacity-50">Loading...</div>
        <div className="btn-primary flex-1 opacity-50">Loading...</div>
      </div>
    );
  }

  function handleAdd() {
    addItem({
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  function handleBuyNow() {
    setLoading(true);
    replaceCart({
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
    });
    router.push("/checkout");
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button type="button" onClick={handleAdd} className="btn-outline flex-1">
        {added ? "✓ Added to Cart" : "Add to Cart"}
      </button>
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={loading}
        className="btn-primary flex-1 disabled:opacity-70"
      >
        Buy Now
      </button>
    </div>
  );
}

export function ProductDetail({
  product,
  reviewSummary,
}: {
  product: Product;
  reviewSummary: ReviewSummary;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url || "/placeholder.svg"}
          alt={product.name}
          className="aspect-square w-full object-cover"
        />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
        {reviewSummary.count > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <StarRating rating={reviewSummary.average} size="md" />
            <span className="text-sm text-gray-600">
              {reviewSummary.average} · {reviewSummary.count.toLocaleString()} reviews
            </span>
          </div>
        )}
        <p className="mt-4 text-3xl font-bold text-brand-700">{formatPrice(product.price)}</p>
        <p className="mt-6 leading-relaxed text-gray-600">{product.description}</p>
        <div className="mt-8">
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}
