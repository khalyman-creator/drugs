"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import {
  CONTROL_LABELS,
  CONTROL_TONE,
  PROCESSING_LABELS,
  PROCESSING_TONE,
  ORDER_GROUP_STATUSES,
  PROCESSING_GROUP_STATUSES,
  SHIPPING_STATUSES,
  SHIPPING_LABELS,
  SHIPPING_ICONS,
  SHIPPING_TONE,
  toneClass,
  type ControlStatus,
  type ProcessingStatus,
  type ShippingStatus,
  type StatusTone,
} from "@/lib/shipping-status";

// This page only ever shows green ("on track"), amber ("paused/hold"), or
// red ("problem") — no blue. "info" collapses into green here so normal,
// nothing-wrong-yet progress reads the same as "done" rather than standing
// out as its own color.
function customerTone(tone: StatusTone): StatusTone {
  return tone === "info" ? "positive" : tone;
}

// The customer-facing shipping ladder never shows "delivery_exception" as a
// sequential step — it's surfaced as the headline + a banner instead, so the
// last real milestone reached before the exception can be shown as DONE
// rather than looking like progress silently reverted.
type ShippedStatus = Exclude<ShippingStatus, "delivery_exception">;
const SHIPPING_LADDER_STATUSES = SHIPPING_STATUSES.filter(
  (s): s is ShippedStatus => s !== "delivery_exception"
);

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
    occurredAt: string;
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

// A real shipment's last-known-good status before a delivery exception was
// set — read from the audit timeline rather than fabricated, so the ladder
// never shows a false "not shipped" state for a package that was actually
// well into transit when the exception was logged.
function lastRealShippingStatus(r: TrackOrderResult): ShippedStatus {
  if (r.shippingStatus !== "delivery_exception") return r.shippingStatus;
  const exceptionEvent = [...r.timeline].reverse().find((e) => e.eventType === "delivery_exception_set");
  const prev = exceptionEvent?.previousValue as ShippedStatus | undefined;
  return prev && (SHIPPING_LADDER_STATUSES as readonly string[]).includes(prev) ? prev : "preparing_shipment";
}

function computeHeadline(r: TrackOrderResult): { icon: string; text: string } {
  if (r.deliveryException) return { icon: "⚠️", text: "Delivery Exception" };
  if (r.hold) return { icon: "⚠️", text: "Shipment On Hold" };
  const effectiveShipping = lastRealShippingStatus(r);
  if (effectiveShipping !== "not_shipped") {
    return { icon: SHIPPING_ICONS[effectiveShipping], text: SHIPPING_LABELS[effectiveShipping] };
  }
  if (r.controlStatus === "cancelled") return { icon: "✕", text: "Order Cancelled" };
  if (r.controlStatus === "on_hold") return { icon: "⏸", text: "Order On Hold" };
  return { icon: "📦", text: PROCESSING_LABELS[r.processingStatus] };
}

function ConnectedStepper({
  steps,
  doneCount,
  currentIndex,
  renderAfter,
}: {
  steps: Array<{ key: string; label: string; icon?: string }>;
  doneCount: number;
  currentIndex: number | null;
  renderAfter?: (index: number) => React.ReactNode;
}) {
  return (
    <ol className="relative ml-2">
      {steps.map((step, i) => {
        const done = i < doneCount;
        const current = i === currentIndex;
        const isLast = i === steps.length - 1;
        return (
          <li key={step.key} className="relative pb-4 pl-6 last:pb-0">
            {!isLast && (
              <span
                className={`absolute -left-[2px] top-4 bottom-0 w-0.5 ${done ? "bg-[#1a7f37]" : "bg-gray-200"}`}
              />
            )}
            {current ? (
              <span
                aria-label="In progress"
                className="absolute -left-[9px] top-0.5 flex h-4 w-4 items-center justify-center"
              >
                <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-green-200 border-t-[#1a7f37]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#1a7f37]" />
              </span>
            ) : (
              <span
                className={`absolute -left-[9px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                  done ? "bg-[#1a7f37] text-white" : "border-2 border-gray-300 bg-white"
                }`}
              >
                {done ? "✓" : ""}
              </span>
            )}
            <span
              className={`flex min-w-0 items-center gap-1.5 text-sm ${
                current ? "font-bold text-green-700" : done ? "text-gray-700" : "text-gray-400"
              }`}
            >
              {step.icon && <span className="shrink-0">{step.icon}</span>}
              <span className="truncate">{step.label}</span>
            </span>
            {renderAfter?.(i)}
          </li>
        );
      })}
    </ol>
  );
}

export function TrackOrderClient({ initialRef }: { initialRef?: string }) {
  const [reference, setReference] = useState(initialRef ?? "");
  const [email, setEmail] = useState("");
  const [needsEmail, setNeedsEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackOrderResult | null>(null);

  async function runSearch(ref: string, emailVal: string) {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: ref, email: emailVal || undefined }),
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

  // A "Track Your Order" link/button from an email deep-links here with
  // ?ref=... — auto-run the lookup instead of making the customer click
  // "Track Order" again on a form that's already filled in for them.
  useEffect(() => {
    if (initialRef) void runSearch(initialRef, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runSearch(reference, email);
  }

  const headline = result ? computeHeadline(result) : null;

  let orderCurrent: number | null = null;
  let orderDone = 0;
  let procCurrent: number | null = null;
  let procDone = 0;
  let shipCurrent: number | null = null;
  let shipDone = 0;
  let effectiveShipping: ShippedStatus = "not_shipped";

  if (result) {
    const allProcessing = [...ORDER_GROUP_STATUSES, ...PROCESSING_GROUP_STATUSES];
    const globalProcIdx = allProcessing.indexOf(result.processingStatus);

    effectiveShipping = lastRealShippingStatus(result);
    const shippingIdx = SHIPPING_LADDER_STATUSES.indexOf(effectiveShipping);
    const shippingActive = shippingIdx > 0 || result.processingStatus === "processing_complete";

    if (shippingActive || globalProcIdx >= ORDER_GROUP_STATUSES.length) {
      orderDone = ORDER_GROUP_STATUSES.length;
    } else {
      orderDone = globalProcIdx;
      orderCurrent = globalProcIdx;
    }

    if (shippingActive) {
      procDone = PROCESSING_GROUP_STATUSES.length;
    } else if (globalProcIdx >= ORDER_GROUP_STATUSES.length) {
      const local = globalProcIdx - ORDER_GROUP_STATUSES.length;
      procDone = local;
      procCurrent = local;
    }

    if (shippingActive) {
      if (effectiveShipping === "delivered") {
        shipDone = SHIPPING_LADDER_STATUSES.length;
      } else {
        shipDone = shippingIdx;
        shipCurrent = shippingIdx;
      }
    }
  }

  const shipAttachIndex = shipCurrent ?? (shipDone > 0 ? shipDone - 1 : 0);

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

      {result && headline && (
        <div className="mt-8 space-y-6">
          {/* Headline — restrained on purpose: plain black text, not a
              colored banner, so it reads as an official document rather
              than a game/toy UI. Color lives in the timeline instead. */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <p className="font-mono text-sm font-semibold tracking-[0.2em] text-gray-500">{result.orderRef}</p>
            <p className="mt-3 text-xl font-bold text-gray-900">
              {headline.icon} {headline.text}
            </p>
            <p className="mt-1 text-xs text-gray-400">Placed {result.createdAtFormatted}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClass(customerTone(CONTROL_TONE[result.controlStatus]))}`}>
                {CONTROL_LABELS[result.controlStatus]}
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClass(customerTone(PROCESSING_TONE[result.processingStatus]))}`}>
                {PROCESSING_LABELS[result.processingStatus]}
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClass(customerTone(SHIPPING_TONE[result.shippingStatus]))}`}>
                {SHIPPING_ICONS[result.shippingStatus]} {SHIPPING_LABELS[result.shippingStatus]}
              </span>
            </div>
            <p className="mt-4 border-t border-gray-100 pt-4 text-lg font-bold text-gray-900">{formatPrice(result.total)}</p>
          </div>

          {result.deliveryException && (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-5">
              <p className="font-semibold text-red-900">⚠️ Delivery Exception</p>
              <p className="mt-1 text-sm text-red-800">{result.deliveryException.reason}</p>
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

          {/* Shipment info — the admin can hide this whole section, or just
              individual fields within it, per order */}
          {result.shipment && (
            <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
              <h2 className="col-span-full font-semibold">Shipment Information</h2>
              <Field label="Carrier" value={result.shipment.carrier} />
              <Field label="Tracking Number" value={result.shipment.trackingNumber} />
              <Field label="Weight" value={result.shipment.weight} />
              <Field label="Shipment Type" value={result.shipment.shipmentType} />
              <Field label="Origin" value={result.shipment.origin} />
              <Field label="Destination" value={result.shipment.destination} />
              <Field label="Estimated Delivery" value={result.shipment.estimatedDelivery} />
            </div>
          )}

          {/* Timeline — three connected groups; a line never spans a group
              boundary, mirroring the fact that order/processing/shipping
              are genuinely independent lanes underneath. */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-semibold">Order Progress</h2>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Order</p>
            <ConnectedStepper
              steps={ORDER_GROUP_STATUSES.map((s) => ({ key: s, label: PROCESSING_LABELS[s] }))}
              doneCount={orderDone}
              currentIndex={orderCurrent}
            />

            <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-gray-400">Processing</p>
            <ConnectedStepper
              steps={PROCESSING_GROUP_STATUSES.map((s) => ({ key: s, label: PROCESSING_LABELS[s] }))}
              doneCount={procDone}
              currentIndex={procCurrent}
            />

            <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-gray-400">Shipping</p>
            <ConnectedStepper
              steps={SHIPPING_LADDER_STATUSES.map((s) => ({ key: s, label: SHIPPING_LABELS[s], icon: SHIPPING_ICONS[s] }))}
              doneCount={shipDone}
              currentIndex={shipCurrent}
              renderAfter={(i) =>
                result.hold && i === shipAttachIndex ? (
                  <div className="mt-2 rounded-xl border border-amber-400 bg-amber-50 p-3">
                    <p className="text-sm font-semibold text-amber-900">⚠️ Shipment On Hold</p>
                    <p className="mt-1 text-xs text-amber-800">{result.hold.reason}</p>
                    {result.hold.message && <p className="mt-1 text-xs text-amber-700">{result.hold.message}</p>}
                  </div>
                ) : null
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
