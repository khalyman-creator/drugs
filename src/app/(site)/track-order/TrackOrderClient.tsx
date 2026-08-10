"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import {
  CONTROL_LABELS,
  PROCESSING_STATUSES,
  PROCESSING_LABELS,
  SHIPPING_STATUSES,
  SHIPPING_LABELS,
  SHIPPING_ICONS,
  processingStageIndex,
  shippingStageIndex,
  type ControlStatus,
  type ProcessingStatus,
  type ShippingStatus,
} from "@/lib/shipping-status";

type TrackOrderItem = {
  name: string;
  image: string | null;
  category: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type TrackOrderResult = {
  orderRef: string;
  createdAtFormatted: string;
  controlStatus: ControlStatus;
  processingStatus: ProcessingStatus;
  shippingStatus: ShippingStatus;
  subtotal: number;
  shipping: number;
  total: number;
  items: TrackOrderItem[];
  receiver: { name: string | null; address: string | null; phone: string | null } | null;
  shipment: {
    carrier: string | null;
    trackingNumber: string | null;
    shipmentType: string | null;
    weight: string | null;
    origin: string | null;
    destination: string | null;
    estimatedDelivery: string | null;
  } | null;
  hold: { reason: string; message: string | null } | null;
  deliveryException: { reason: string; since: string | null } | null;
  timeline: Array<{
    eventType: string;
    previousValue: string | null;
    newValue: string | null;
    customerMessage: string | null;
    createdAt: string;
  }>;
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-0.5 truncate text-sm ${value ? "text-gray-900" : "text-gray-400"}`}>
        {value || "Pending"}
      </p>
    </div>
  );
}

function StatusLadder<T extends string>({
  statuses,
  labels,
  icons,
  currentIndex,
}: {
  statuses: readonly T[];
  labels: Record<T, string>;
  icons?: Record<T, string>;
  currentIndex: number;
}) {
  return (
    <ul className="space-y-2">
      {statuses.map((s, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <li key={s} className="flex min-w-0 items-center gap-2 text-sm">
            <span className={`shrink-0 ${done ? "text-brand-600" : current ? "text-brand-600" : "text-gray-300"}`}>
              {done ? "✓" : current ? "●" : "○"}
            </span>
            {icons && <span className="shrink-0">{icons[s]}</span>}
            <span className={`min-w-0 truncate ${current ? "font-bold text-gray-900" : done ? "text-gray-700" : "text-gray-400"}`}>
              {labels[s]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function TrackOrderClient({ initialRef }: { initialRef?: string }) {
  const [reference, setReference] = useState(initialRef ?? "");
  const [email, setEmail] = useState("");
  const [needsEmail, setNeedsEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackOrderResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, email: email || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.requiresEmail) setNeedsEmail(true);
        setError(data.error || "Order not found.");
        return;
      }

      setResult(data);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Order Reference</label>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="SLK-XXXXXXXX"
            required
            className="w-full rounded-xl border px-4 py-2.5 font-mono uppercase"
          />
        </div>
        {needsEmail && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email used at checkout
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border px-4 py-2.5"
            />
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Looking up..." : "Track Order"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {result && (
        <div className="mt-8 space-y-6">
          {/* Order header */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-sm font-semibold text-gray-900">{result.orderRef}</p>
              <p className="text-xs text-gray-400">{result.createdAtFormatted}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                {CONTROL_LABELS[result.controlStatus]}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                {PROCESSING_LABELS[result.processingStatus]}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                {SHIPPING_ICONS[result.shippingStatus]} {SHIPPING_LABELS[result.shippingStatus]}
              </span>
            </div>
            <p className="mt-3 text-lg font-bold text-brand-700">{formatPrice(result.total)}</p>
          </div>

          {result.hold && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
              <p className="font-semibold text-amber-900">⚠️ Shipment On Hold</p>
              <p className="mt-1 text-sm text-amber-800">{result.hold.reason}</p>
              {result.hold.message && <p className="mt-2 text-sm text-amber-700">{result.hold.message}</p>}
            </div>
          )}

          {result.deliveryException && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
              <p className="font-semibold text-amber-900">⚠️ Delivery Exception</p>
              <p className="mt-1 text-sm text-amber-800">{result.deliveryException.reason}</p>
            </div>
          )}

          {/* Items */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-3 font-semibold">Order Details</h2>
            <ul className="divide-y">
              {result.items.map((item, i) => (
                <li key={i} className="flex min-w-0 items-center gap-3 py-3">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400">Qty {item.quantity} · {formatPrice(item.unitPrice)}</p>
                  </div>
                  <p className="shrink-0 font-semibold text-gray-900">{formatPrice(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Receiver */}
          {result.receiver && (
            <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
              <h2 className="col-span-full font-semibold">Receiver</h2>
              <Field label="Name" value={result.receiver.name} />
              <Field label="Phone" value={result.receiver.phone} />
              <div className="col-span-full min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Address</p>
                <p className={`mt-0.5 text-sm ${result.receiver.address ? "text-gray-900" : "text-gray-400"}`}>
                  {result.receiver.address || "Pending"}
                </p>
              </div>
            </div>
          )}

          {/* Shipment info */}
          <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
            <h2 className="col-span-full font-semibold">Shipment Information</h2>
            <Field label="Carrier" value={result.shipment?.carrier} />
            <Field label="Tracking Number" value={result.shipment?.trackingNumber} />
            <Field label="Weight" value={result.shipment?.weight} />
            <Field label="Shipment Type" value={result.shipment?.shipmentType} />
            <Field label="Origin" value={result.shipment?.origin} />
            <Field label="Destination" value={result.shipment?.destination} />
            <Field label="Estimated Delivery" value={result.shipment?.estimatedDelivery} />
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-semibold">Order Progress</h2>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Processing</p>
            <StatusLadder
              statuses={PROCESSING_STATUSES}
              labels={PROCESSING_LABELS}
              currentIndex={processingStageIndex(result.processingStatus)}
            />

            <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-gray-400">Shipping</p>
            <StatusLadder
              statuses={SHIPPING_STATUSES}
              labels={SHIPPING_LABELS}
              icons={SHIPPING_ICONS}
              currentIndex={shippingStageIndex(result.shippingStatus)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
