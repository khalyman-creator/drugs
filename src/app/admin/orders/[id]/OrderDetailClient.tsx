"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { formatOrderReference } from "@/lib/email/order-ref";
import type { OrderWithDetails } from "@/lib/db/supabase-orders";
import type { ShipmentRecord } from "@/lib/db/supabase-shipments";
import type { OrderStatusEvent } from "@/lib/db/supabase-order-events";
import type { PaymentRecord } from "@/lib/db/supabase-payments";
import {
  CONTROL_STATUSES,
  CONTROL_LABELS,
  PROCESSING_STATUSES,
  PROCESSING_LABELS,
  SHIPPING_STATUSES,
  SHIPPING_LABELS,
  SHIPPING_ICONS,
  HOLD_REASONS,
  HOLD_REASON_LABELS,
  type ControlStatus,
  type ProcessingStatus,
  type ShippingStatus,
  type HoldReason,
} from "@/lib/shipping-status";

const SELECTABLE_SHIPPING_STATUSES = SHIPPING_STATUSES.filter((s) => s !== "delivery_exception");

function EventLabel({ event }: { event: OrderStatusEvent }) {
  switch (event.event_type) {
    case "control_status":
      return <>Control status → {CONTROL_LABELS[event.new_value as ControlStatus] ?? event.new_value}</>;
    case "processing_status":
      return <>Processing → {PROCESSING_LABELS[event.new_value as ProcessingStatus] ?? event.new_value}</>;
    case "shipping_status":
      return <>Shipping → {SHIPPING_LABELS[event.new_value as ShippingStatus] ?? event.new_value}</>;
    case "hold_placed":
      return <>⚠️ Shipment hold placed — {HOLD_REASON_LABELS[event.new_value as HoldReason] ?? event.new_value}</>;
    case "hold_released":
      return <>Hold released — shipment resumed</>;
    case "delivery_exception_set":
      return <>⚠️ Delivery exception — {event.new_value}</>;
    case "delivery_exception_resolved":
      return <>Delivery exception resolved → {SHIPPING_LABELS[event.new_value as ShippingStatus] ?? event.new_value}</>;
    default:
      return <>{event.event_type}</>;
  }
}

export function OrderDetailClient({
  order: initialOrder,
  shipment: initialShipment,
  events: initialEvents,
  payment,
}: {
  order: OrderWithDetails;
  shipment: ShipmentRecord;
  events: OrderStatusEvent[];
  payment: PaymentRecord | null;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [shipment, setShipment] = useState(initialShipment);
  const [events, setEvents] = useState(initialEvents);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [markingPaid, setMarkingPaid] = useState(false);

  // initialEvents is a fresh array from the server on every router.refresh(),
  // but useState only reads it on first mount — resync explicitly so the
  // timeline actually updates after a status change instead of going stale.
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const [shipForm, setShipForm] = useState({
    carrier: initialShipment.carrier ?? "",
    tracking_number: initialShipment.tracking_number ?? "",
    shipment_type: initialShipment.shipment_type ?? "",
    weight_value: initialShipment.weight_value != null ? String(initialShipment.weight_value) : "",
    weight_unit: initialShipment.weight_unit ?? "",
    origin: initialShipment.origin ?? "",
    destination: initialShipment.destination ?? "",
    estimated_delivery: initialShipment.estimated_delivery ?? "",
  });
  const [savingShipment, setSavingShipment] = useState(false);
  const [shipmentMessage, setShipmentMessage] = useState("");

  const [holdFormOpen, setHoldFormOpen] = useState(false);
  const [holdReason, setHoldReason] = useState<HoldReason>("other");
  const [holdCustomerMessage, setHoldCustomerMessage] = useState("");
  const [holdInternalNote, setHoldInternalNote] = useState("");
  const [savingHold, setSavingHold] = useState(false);

  const [exceptionFormOpen, setExceptionFormOpen] = useState(false);
  const [exceptionReason, setExceptionReason] = useState("");
  const [savingException, setSavingException] = useState(false);

  async function refreshEvents() {
    router.refresh();
  }

  async function handleMarkPaid() {
    if (!confirm("Confirm this order was actually paid outside the automatic payment flow? This will send the customer a receipt email.")) {
      return;
    }
    setMarkingPaid(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/mark-paid`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to mark order as paid");
        return;
      }
      setOrder((prev) => ({ ...prev, ...data }));
      await refreshEvents();
    } finally {
      setMarkingPaid(false);
    }
  }

  async function patchStatus(
    field: "control-status" | "processing-status",
    bodyKey: "control_status" | "processing_status",
    value: string
  ) {
    setSavingField(field);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/${field}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [bodyKey]: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update status");
        return;
      }
      setOrder((prev) => ({ ...prev, ...data }));
      await refreshEvents();
    } finally {
      setSavingField(null);
    }
  }

  async function handleShippingStatusChange(newStatus: ShippingStatus) {
    setSavingField("shipping-status");
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/shipping-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipping_status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update shipping status");
        return;
      }
      setOrder((prev) => ({ ...prev, ...data }));
      await refreshEvents();
    } finally {
      setSavingField(null);
    }
  }

  async function handleSetException(e: React.FormEvent) {
    e.preventDefault();
    if (!exceptionReason.trim()) return;
    setSavingException(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/shipping-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipping_status: "delivery_exception", delivery_exception_reason: exceptionReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to set delivery exception");
        return;
      }
      setOrder((prev) => ({ ...prev, ...data }));
      setExceptionFormOpen(false);
      setExceptionReason("");
      await refreshEvents();
    } finally {
      setSavingException(false);
    }
  }

  async function handleSaveShipment(e: React.FormEvent) {
    e.preventDefault();
    setSavingShipment(true);
    setShipmentMessage("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/shipment-info`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...shipForm,
          weight_value: shipForm.weight_value === "" ? null : Number(shipForm.weight_value),
          estimated_delivery: shipForm.estimated_delivery || "",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShipment(data);
        setShipmentMessage("Saved!");
      } else {
        setShipmentMessage("Failed to save");
      }
    } finally {
      setSavingShipment(false);
    }
  }

  async function handlePlaceHold(e: React.FormEvent) {
    e.preventDefault();
    setSavingHold(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/hold`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "place",
          reason: holdReason,
          customer_message: holdCustomerMessage.trim() || undefined,
          internal_note: holdInternalNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to place hold");
        return;
      }
      setShipment(data);
      setHoldFormOpen(false);
      setHoldCustomerMessage("");
      setHoldInternalNote("");
      await refreshEvents();
    } finally {
      setSavingHold(false);
    }
  }

  async function handleReleaseHold() {
    setSavingHold(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/hold`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "release" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to release hold");
        return;
      }
      setShipment(data);
      await refreshEvents();
    } finally {
      setSavingHold(false);
    }
  }

  const orderRef = formatOrderReference(order.id);
  const canShip = order.processing_status === "processing_complete";

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-brand-600 hover:underline">
          ← Back to Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Order {orderRef}</h1>
        <p className="text-sm text-gray-500">Placed {new Date(order.created_at).toLocaleString()}</p>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Order / customer / items summary */}
      <div className="mb-6 grid gap-6 rounded-2xl border bg-white p-6 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Customer</p>
          <p className="mt-1 font-medium">{order.customer?.full_name ?? "Unknown"}</p>
          <p className="text-sm text-gray-500">{order.customer?.email}</p>
          {order.customer?.phone && <p className="text-sm text-gray-500">{order.customer.phone}</p>}
          {order.customer?.shipping_address && (
            <p className="mt-2 text-sm text-gray-600">{order.customer.shipping_address}</p>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Payment</p>
          <p className="mt-1 font-medium capitalize">{order.status}</p>
          {payment && (
            <>
              <p className="text-sm text-gray-500">{payment.provider}</p>
              {payment.provider_payment_id && (
                <p className="break-all text-xs text-gray-400">Ref: {payment.provider_payment_id}</p>
              )}
            </>
          )}
          <p className="mt-2 text-lg font-bold text-brand-700">{formatPrice(Number(order.total))}</p>
          {order.status !== "paid" && (
            <button
              type="button"
              onClick={handleMarkPaid}
              disabled={markingPaid}
              className="mt-3 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-100 disabled:opacity-60"
            >
              {markingPaid ? "Confirming..." : "Mark as Paid"}
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="p-3 font-medium">Item</th>
              <th className="p-3 font-medium">Qty</th>
              <th className="p-3 font-medium">Unit</th>
              <th className="p-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="min-w-0 p-3">
                  <p className="truncate font-medium">{item.name}</p>
                  {item.category && <p className="text-xs text-gray-400">{item.category}</p>}
                </td>
                <td className="p-3">{item.quantity}</td>
                <td className="p-3">{formatPrice(Number(item.price))}</td>
                <td className="p-3 font-medium">{formatPrice(Number(item.price) * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status control panel */}
      <div className="mb-6 grid gap-4 rounded-2xl border bg-white p-6 sm:grid-cols-3">
        <div className="min-w-0">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Control Status
          </label>
          <select
            value={order.control_status}
            disabled={savingField === "control-status"}
            onChange={(e) => patchStatus("control-status", "control_status", e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
          >
            {CONTROL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CONTROL_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Order Processing
          </label>
          <select
            value={order.processing_status}
            disabled={savingField === "processing-status"}
            onChange={(e) => patchStatus("processing-status", "processing_status", e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
          >
            {PROCESSING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROCESSING_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Shipping Status
          </label>
          <select
            value={order.shipping_status === "delivery_exception" ? "delivery_exception" : order.shipping_status}
            disabled={savingField === "shipping-status" || !canShip}
            onChange={(e) => handleShippingStatusChange(e.target.value as ShippingStatus)}
            className="w-full rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
          >
            {order.shipping_status === "delivery_exception" && (
              <option value="delivery_exception">Delivery Exception</option>
            )}
            {SELECTABLE_SHIPPING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {SHIPPING_ICONS[s]} {SHIPPING_LABELS[s]}
              </option>
            ))}
          </select>
          {!canShip && (
            <p className="mt-1 text-xs text-amber-600">Complete order processing before shipping can start.</p>
          )}
          {canShip && order.shipping_status !== "delivery_exception" && (
            <button
              type="button"
              onClick={() => setExceptionFormOpen((v) => !v)}
              className="mt-2 text-xs font-semibold text-amber-700 hover:underline"
            >
              ⚠️ Mark Delivery Exception
            </button>
          )}
          {exceptionFormOpen && (
            <form onSubmit={handleSetException} className="mt-2 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <textarea
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                placeholder="Reason (shown to customer)"
                rows={2}
                required
                className="w-full rounded-lg border px-2 py-1.5 text-xs"
              />
              <button
                type="submit"
                disabled={savingException}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {savingException ? "Saving..." : "Set Exception"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Shipment info */}
      <form onSubmit={handleSaveShipment} className="mb-6 space-y-4 rounded-2xl border bg-white p-6">
        <h2 className="font-semibold">Shipment Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["carrier", "Carrier"],
              ["tracking_number", "Tracking Number"],
              ["shipment_type", "Shipment Type"],
              ["weight_unit", "Weight Unit"],
              ["origin", "Origin"],
              ["destination", "Destination"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="min-w-0">
              <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
              <input
                value={shipForm[key]}
                onChange={(e) => setShipForm({ ...shipForm, [key]: e.target.value })}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
            </div>
          ))}
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-gray-500">Weight</label>
            <input
              type="number"
              step="0.01"
              value={shipForm.weight_value}
              onChange={(e) => setShipForm({ ...shipForm, weight_value: e.target.value })}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-gray-500">Estimated Delivery</label>
            <input
              type="date"
              value={shipForm.estimated_delivery}
              onChange={(e) => setShipForm({ ...shipForm, estimated_delivery: e.target.value })}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={savingShipment}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {savingShipment ? "Saving..." : "Save Shipment Info"}
          </button>
          {shipmentMessage && (
            <span className={`text-sm ${shipmentMessage === "Saved!" ? "text-green-600" : "text-red-600"}`}>
              {shipmentMessage}
            </span>
          )}
        </div>
      </form>

      {/* Hold panel */}
      <div className="mb-6 rounded-2xl border bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Shipment Hold</h2>
          {shipment.hold_active ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              ⚠️ On Hold — {HOLD_REASON_LABELS[shipment.hold_reason as HoldReason]}
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              Not on hold
            </span>
          )}
        </div>

        {shipment.hold_active ? (
          <button
            type="button"
            onClick={handleReleaseHold}
            disabled={savingHold}
            className="mt-4 rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {savingHold ? "Releasing..." : "Release Hold / Resume Shipment"}
          </button>
        ) : holdFormOpen ? (
          <form onSubmit={handlePlaceHold} className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Reason</label>
              <select
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value as HoldReason)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              >
                {HOLD_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {HOLD_REASON_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Customer-facing message (optional)</label>
              <textarea
                value={holdCustomerMessage}
                onChange={(e) => setHoldCustomerMessage(e.target.value)}
                rows={2}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Internal note (admin only)</label>
              <textarea
                value={holdInternalNote}
                onChange={(e) => setHoldInternalNote(e.target.value)}
                rows={2}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={savingHold}
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {savingHold ? "Placing..." : "Confirm Hold"}
              </button>
              <button
                type="button"
                onClick={() => setHoldFormOpen(false)}
                className="rounded-xl border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setHoldFormOpen(true)}
            className="mt-4 rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Place Shipment On Hold
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="mb-4 font-semibold">Timeline</h2>
        {events.length === 0 ? (
          <p className="text-sm text-gray-400">No events yet.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => (
              <li key={e.id} className="border-l-2 border-gray-200 pl-4 text-sm">
                <p className="text-gray-900">
                  <EventLabel event={e} />
                </p>
                {e.reason && <p className="text-xs text-gray-400">Note: {e.reason}</p>}
                {e.customer_message && <p className="text-xs text-gray-500">Message: {e.customer_message}</p>}
                <p className="text-xs text-gray-400">{new Date(e.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
