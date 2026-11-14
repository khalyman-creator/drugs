"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MINIMUM_AGE } from "@/lib/age-gate";

/**
 * Blocks the storefront until a visitor confirms they meet the minimum age.
 *
 * Rendered by the storefront layout *instead of* the shop, not layered over it,
 * so product content is never sent to an unverified visitor.
 */
export function AgeGate({ storeName }: { storeName: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [error, setError] = useState("");

  async function confirmAge() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/age-verify", { method: "POST" });
      if (!res.ok) throw new Error("request failed");
      // Into the shop. Deliberately leaves `submitting` true: this component is
      // about to be replaced, and re-enabling the button first would only let
      // it be double-clicked.
      router.replace("/");
      router.refresh();
    } catch {
      setError("Could not confirm right now. Please try again.");
      setSubmitting(false);
    }
  }

  if (declined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md border-2 border-gray-900 bg-white p-8 text-center shadow-pop-ink">
          <h1 className="font-display text-2xl uppercase leading-none tracking-tight text-gray-900">
            Come back another time
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            You must be {MINIMUM_AGE} or older to view this store.
          </p>
          <button
            type="button"
            onClick={() => setDeclined(false)}
            className="btn-outline mt-6 w-full"
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md border-2 border-gray-900 bg-white p-8 text-center shadow-pop-ink">
        <p className="font-display text-xl uppercase tracking-tight">
          <span className="text-gray-900">Silk</span>
          <span className="text-brand-600">Freedom</span>
        </p>
        <span className="accent-bar mx-auto" />

        <h1 className="font-display mt-6 text-3xl uppercase leading-none tracking-tight text-gray-900">
          Are you {MINIMUM_AGE} or older?
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          {storeName} sells products intended for adults only. Please confirm your age
          to continue.
        </p>

        {error ? (
          <p className="mt-4 text-sm font-semibold text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={confirmAge}
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-60"
          >
            {submitting ? "One moment…" : `Yes, I am ${MINIMUM_AGE} or older`}
          </button>
          <button
            type="button"
            onClick={() => setDeclined(true)}
            disabled={submitting}
            className="btn-outline w-full disabled:opacity-60"
          >
            No, I am under {MINIMUM_AGE}
          </button>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-gray-400">
          By entering you confirm you are of legal age in your jurisdiction and accept
          responsibility for complying with the laws that apply to you.
        </p>
      </div>
    </main>
  );
}
