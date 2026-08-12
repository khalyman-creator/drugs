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
  CONTROL_TONE,
  PROCESSING_STATUSES,
  PROCESSING_LABELS,
  PROCESSING_TONE,
  SHIPPING_STATUSES,
  SHIPPING_LABELS,
  SHIPPING_ICONS,
  SHIPPING_TONE,
  ORDER_STATUS_TONE,
  HOLD_REASONS,
  HOLD_REASON_LABELS,
  SHIPMENT_FIELD_KEYS,
  SHIPMENT_FIELD_LABELS,
  toneClass,
  type ControlStatus,
  type ProcessingStatus,
  type ShippingStatus,
  type HoldReason,
  type ShipmentFieldKey,
  type StatusTone,
} from "@/lib/shipping-status";

const SELECTABLE_SHIPPING_STATUSES = SHIPPING_STATUSES.filter((s) => s !== "delivery_exception");

function nowDatetimeLocalValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function StatusChangeCard<T extends string>({
  label,
  currentValue,
  options,
  labels,
  icons,
  tone,
  disabled,
  disabledHint,
  saving,
  onSave,
  footer,
}: {
  label: string;
  currentValue: T;
  options: readonly T[];
  labels: Record<T, string>;
  icons?: Record<T, string>;
  tone: Record<T, StatusTone>;
  disabled?: boolean;
  disabledHint?: string;
  saving: boolean;
  onSave: (value: T, note: string, occurredAtIso: string | null) => Promise<void>;
  footer?: React.ReactNode;
}) {
  const [pending, setPending] = useState<T>(currentValue);
  useEffect(() => setPending(currentValue), [currentValue]);
  const [note, setNote] = useState("");
  const [backdate, setBackdate] = useState("");

  const dirty = pending !== currentValue || note.trim() !== "";

  async function handleSave() {
    const occurredAtIso = backdate ? new Date(backdate).toISOString() : null;
    await onSave(pending, note.trim(), occurredAtIso);
    setNote("");
    setBackdate("");
  }

  return (
    <div className="min-w-0">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</label>
      <select
        value={pending}
        disabled={disabled || saving}
        onChange={(e) => setPending(e.target.value as T)}
        className={`w-full rounded-xl border px-3 py-2 text-sm font-medium disabled:opacity-60 ${toneClass(tone[pending])}`}
      >
        {options.map((s) => (
          <option key={s} value={s}>
            {icons ? `${icons[s]} ` : ""}
            {labels[s]}
          </option>
        ))}
      </select>
      {disabled && disabledHint && <p className="mt-1 text-xs text-amber-600">{disabledHint}</p>}
      {!disabled && (
        <div className="mt-2 space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note"
            rows={2}
            className="w-full rounded-lg border px-2 py-1.5 text-xs"
          />
          <input
            type="datetime-local"
            value={backdate}
            max={nowDatetimeLocalValue()}
            onChange={(e) => setBackdate(e.target.value)}
            title="Backdate this change (optional) — leave blank to log it as happening now"
            className="w-full rounded-lg border px-2 py-1.5 text-xs text-gray-500"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="w-full rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      )}
      {footer}
    </div>
  );
}

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
  const [showShipmentDetails, setShowShipmentDetails] = useState(initialShipment.show_shipment_details);
  const [hiddenFields, setHiddenFields] = useState<Set<ShipmentFieldKey>>(
    new Set(initialShipment.hidden_fields as ShipmentFieldKey[])
  );

  function toggleFieldVisibility(field: ShipmentFieldKey) {
    setHiddenFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  }

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
    value: string,
    reason: string,
    occurredAt: string | null
  ) {
    setSavingField(field);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/${field}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [bodyKey]: value, reason: reason || undefined, occurred_at: occurredAt || undefined }),
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

  async function handleShippingStatusChange(newStatus: ShippingStatus, reason: string, occurredAt: string | null) {
    setSavingField("shipping-status");
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/shipping-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipping_status: newStatus, reason: reason || undefined, occurred_at: occurredAt || undefined }),
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
          show_shipment_details: showShipmentDetails,
          hidden_fields: Array.from(hiddenFields),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShipment(data);
        setShowShipmentDetails(data.show_shipment_details);
        setHiddenFields(new Set(data.hidden_fields as ShipmentFieldKey[]));
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
          <span
            className={`mt-1 inline-block rounded-full border px-3 py-1 text-xs font-semibold capitalize ${toneClass(
              ORDER_STATUS_TONE[order.status] ?? "neutral"
            )}`}
          >
            {order.status}
          </span>
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
      <div className="mb-6 grid gap-6 rounded-2xl border bg-white p-6 sm:grid-cols-3">
        <StatusChangeCard
          label="Control Status"
          currentValue={order.control_status}
          options={CONTROL_STATUSES}
          labels={CONTROL_LABELS}
          tone={CONTROL_TONE}
          saving={savingField === "control-status"}
          onSave={(value, note, occurredAt) =>
            patchStatus("control-status", "control_status", value, note, occurredAt)
          }
        />
        <StatusChangeCard
          label="Order Processing"
          currentValue={order.processing_status}
          options={PROCESSING_STATUSES}
          labels={PROCESSING_LABELS}
          tone={PROCESSING_TONE}
          saving={savingField === "processing-status"}
          onSave={(value, note, occurredAt) =>
            patchStatus("processing-status", "processing_status", value, note, occurredAt)
          }
        />
        <StatusChangeCard
          label="Shipping Status"
          currentValue={order.shipping_status === "delivery_exception" ? "delivery_exception" : order.shipping_status}
          options={
            order.shipping_status === "delivery_exception"
              ? (["delivery_exception", ...SELECTABLE_SHIPPING_STATUSES] as ShippingStatus[])
              : SELECTABLE_SHIPPING_STATUSES
          }
          labels={SHIPPING_LABELS}
          icons={SHIPPING_ICONS}
          tone={SHIPPING_TONE}
          disabled={!canShip}
          disabledHint="Complete order processing before shipping can start."
          saving={savingField === "shipping-status"}
          onSave={(value, note, occurredAt) => handleShippingStatusChange(value, note, occurredAt)}
          footer={
            <>
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
            </>
          }
        />
      </div>

      {/* Shipment info */}
      <form onSubmit={handleSaveShipment} className="mb-6 space-y-4 rounded-2xl border bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Shipment Information</h2>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showShipmentDetails}
              onChange={(e) => setShowShipmentDetails(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Show this section to the customer
          </label>
        </div>
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

        <div className={`rounded-xl border p-4 ${showShipmentDetails ? "border-gray-200" : "border-gray-100 opacity-50"}`}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Fields visible to the customer
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SHIPMENT_FIELD_KEYS.map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  disabled={!showShipmentDetails}
                  checked={!hiddenFields.has(key)}
                  onChange={() => toggleFieldVisibility(key)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                {SHIPMENT_FIELD_LABELS[key]}
              </label>
            ))}
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
                <p className="text-xs text-gray-400">
                  {new Date(e.occurred_at).toLocaleString()}
                  {Math.abs(new Date(e.occurred_at).getTime() - new Date(e.created_at).getTime()) > 5 * 60 * 1000 && (
                    <span className="ml-1 italic">(backdated)</span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
