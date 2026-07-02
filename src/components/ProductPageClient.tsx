"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { StarRating } from "./StarRating";
import type { Product } from "@/lib/types";
import type { Review, ReviewSummary } from "@/lib/review-types";
import { useCart } from "./CartProvider";

function AddToCartBlock({ product }: { product: Product }) {
  const { addItem, replaceCart, hydrated } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!hydrated) {
    return <div className="h-24 animate-pulse rounded-lg bg-gray-100" />;
  }

  function handleAdd() {
    addItem(
      {
        product_id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  function handleBuyNow() {
    setLoading(true);
    replaceCart(
      {
        product_id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
      },
      qty
    );
    router.push("/checkout");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Quantity</span>
        <div className="flex items-center rounded-lg border border-gray-300">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-4 py-2 text-lg hover:bg-gray-50"
          >
            −
          </button>
          <span className="min-w-[3rem] border-x border-gray-300 py-2 text-center font-medium">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="px-4 py-2 text-lg hover:bg-gray-50"
          >
            +
          </button>
        </div>
      </div>

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
        Buy Now — {formatPrice(product.price * qty)}
      </button>
    </div>
  );
}

function ReviewsTab({
  productId,
  initialReviews,
  initialSummary,
}: {
  productId: number;
  initialReviews: Review[];
  initialSummary: ReviewSummary;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [summary, setSummary] = useState(initialSummary);
  const [showAll, setShowAll] = useState(false);
  const [form, setForm] = useState({ author_name: "", rating: 5, text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const displayed = showAll ? reviews : reviews.slice(0, 8);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, ...form }),
    });

    if (res.ok) {
      const newReview = await res.json();
      setReviews((prev) => [newReview, ...prev]);
      const newCount = summary.count + 1;
      const newAvg =
        Math.round(((summary.average * summary.count + form.rating) / newCount) * 10) / 10;
      setSummary({ average: newAvg, count: newCount });
      setForm({ author_name: "", rating: 5, text: "" });
      setMessage("Review posted! Thanks.");
    } else {
      setMessage("Could not post review.");
    }
    setSubmitting(false);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center lg:sticky lg:top-24 lg:self-start">
        <p className="text-5xl font-bold text-gray-900">{summary.average || "—"}</p>
        <StarRating rating={summary.average} size="md" />
        <p className="mt-2 text-sm text-gray-500">
          {summary.count.toLocaleString()} customer reviews
        </p>
        <div className="mt-4 space-y-1 text-xs text-gray-500">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r) => r.rating === star).length;
            const pct = summary.count ? Math.round((count / summary.count) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-8">{star} ★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="font-semibold">Write a Review</h3>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              required
              value={form.author_name}
              onChange={(e) => setForm({ ...form, author_name: e.target.value })}
              className="rounded-lg border border-gray-300 px-4 py-2 sm:col-span-2"
              placeholder="Your name"
            />
            <select
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              className="rounded-lg border border-gray-300 px-4 py-2"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
              {submitting ? "Posting..." : "Submit Review"}
            </button>
            <textarea
              required
              rows={3}
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              className="rounded-lg border border-gray-300 px-4 py-2 sm:col-span-2"
              placeholder="Your review..."
            />
          </form>
          {message && <p className="mt-2 text-sm text-brand-600">{message}</p>}
        </div>

        {displayed.map((review) => (
          <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={review.avatar_url}
                alt=""
                className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-gray-100"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{review.author_name}</span>
                  {review.verified && (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      ✓ Verified Purchase
                    </span>
                  )}
                </div>
                <StarRating rating={review.rating} />
                <p className="mt-2 text-gray-600">{review.text}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}

        {reviews.length > 8 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full rounded-lg border py-3 text-sm font-medium hover:bg-gray-50"
          >
            Load all {reviews.length.toLocaleString()} reviews
          </button>
        )}
      </div>
    </div>
  );
}

export function ProductPageClient({
  product,
  sectionName,
  reviewSummary,
  reviews,
}: {
  product: Product;
  sectionName: string;
  reviewSummary: ReviewSummary;
  reviews: Review[];
}) {
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");

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

          {reviewSummary.count > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className="mt-3 flex items-center gap-2 text-left"
            >
              <StarRating rating={reviewSummary.average} size="md" />
              <span className="text-sm text-gray-600 underline-offset-2 hover:underline">
                ({reviewSummary.count.toLocaleString()} reviews)
              </span>
            </button>
          )}

          <p className="mt-5 text-4xl font-bold text-brand-700">{formatPrice(product.price)}</p>
          <p className="mt-1 text-sm text-gray-400">SKU: RD-{product.id}</p>

          <p className="mt-6 border-t border-gray-100 pt-6 text-gray-600 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-8">
            <AddToCartBlock product={product} />
          </div>

          <ul className="mt-8 space-y-2 border-t border-gray-100 pt-6 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="text-brand-600">✓</span> Secure checkout
            </li>
            <li className="flex items-center gap-2">
              <span className="text-brand-600">✓</span> Verified customer reviews
            </li>
            <li className="flex items-center gap-2">
              <span className="text-brand-600">✓</span> BTC payment available at checkout
            </li>
          </ul>
        </div>
      </div>

      {/* Tabs — Description | Reviews */}
      <div className="mt-12">
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("description")}
            className={`px-6 py-3 text-sm font-semibold uppercase tracking-wide ${
              activeTab === "description"
                ? "border-b-2 border-brand-600 text-brand-700"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Description
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`px-6 py-3 text-sm font-semibold uppercase tracking-wide ${
              activeTab === "reviews"
                ? "border-b-2 border-brand-600 text-brand-700"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Reviews ({reviewSummary.count.toLocaleString()})
          </button>
        </div>

        <div className="py-8">
          {activeTab === "description" && (
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
          )}
          {activeTab === "reviews" && (
            <ReviewsTab
              productId={product.id}
              initialReviews={reviews}
              initialSummary={reviewSummary}
            />
          )}
        </div>
      </div>
    </>
  );
}
