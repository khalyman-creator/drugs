"use client";

import { useState } from "react";
import { StarRating } from "./StarRating";
import type { Review } from "@/lib/review-types";

export function ProductReviews({
  productId,
  initialReviews,
  initialSummary,
}: {
  productId: number;
  initialReviews: Review[];
  initialSummary: { average: number; count: number };
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [summary, setSummary] = useState(initialSummary);
  const [showAll, setShowAll] = useState(false);
  const [form, setForm] = useState({ author_name: "", rating: 5, text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const displayed = showAll ? reviews : reviews.slice(0, 10);

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
      const newAvg = Math.round(((summary.average * summary.count + form.rating) / newCount) * 10) / 10;
      setSummary({ average: newAvg, count: newCount });
      setForm({ author_name: "", rating: 5, text: "" });
      setMessage("Review posted! Thanks.");
    } else {
      setMessage("Could not post review. Try again.");
    }
    setSubmitting(false);
  }

  return (
    <section className="mt-12 border-t border-gray-200 pt-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
          {summary.count > 0 && (
            <div className="mt-2 flex items-center gap-3">
              <StarRating rating={summary.average} size="md" />
              <span className="text-sm text-gray-600">
                {summary.average} out of 5 · {summary.count.toLocaleString()} reviews
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-10 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900">Write a Review</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Your name</label>
            <input
              required
              value={form.author_name}
              onChange={(e) => setForm({ ...form, author_name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Rating</label>
            <select
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              className="rounded-lg border border-gray-300 px-4 py-2"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Your review</label>
            <textarea
              required
              rows={3}
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
              placeholder="Share your experience..."
            />
          </div>
          {message && <p className="text-sm text-brand-600">{message}</p>}
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
            {submitting ? "Posting..." : "Post Review"}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {displayed.map((review) => (
          <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={review.avatar_url}
                alt={review.author_name}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-900">{review.author_name}</span>
                  {review.verified && (
                    <span className="rounded bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                      Verified Purchase
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
      </div>

      {reviews.length > 10 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-6 w-full rounded-lg border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Show all {reviews.length.toLocaleString()} reviews
        </button>
      )}
    </section>
  );
}
