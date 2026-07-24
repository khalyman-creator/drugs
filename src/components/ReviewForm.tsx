"use client";

import { useState } from "react";

export function ReviewForm() {
  const [form, setForm] = useState({ name: "", comment: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not submit your review.");
        setLoading(false);
        return;
      }

      setSent(true);
      setForm({ name: "", comment: "" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-sm border-2 border-gray-900 bg-white p-6 text-center">
        <p className="font-display text-lg text-gray-900">Thanks for sharing!</p>
        <p className="mt-2 text-sm text-gray-600">
          Your review is in — we&apos;ll take a look and get it posted soon.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 max-w-xl rounded-sm border-2 border-gray-900 bg-white p-6">
      <p className="font-display text-lg text-gray-900">Leave a review</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Your name</label>
          <input
            required
            type="text"
            maxLength={80}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Your review</label>
          <textarea
            required
            rows={4}
            maxLength={1000}
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
          {loading ? "Submitting…" : "Submit review"}
        </button>
      </form>
    </div>
  );
}
