// Single source of truth for the three order-tracking status lanes, shared
// by the admin order UI, the customer /track-order page, and the DB layer.
// Order matters for the arrays below — it drives the customer-facing
// step-ladder ("completed" vs "current" vs "pending" stage).

export const CONTROL_STATUSES = ["active", "on_hold", "cancelled", "completed"] as const;
export type ControlStatus = (typeof CONTROL_STATUSES)[number];

export const PROCESSING_STATUSES = [
  "order_received",
  "payment_confirmed",
  "processing",
  "preparing_order",
  "order_verification",
  "ready_for_shipment",
  "processing_complete",
] as const;
export type ProcessingStatus = (typeof PROCESSING_STATUSES)[number];

export const SHIPPING_STATUSES = [
  "not_shipped",
  "preparing_shipment",
  "shipped",
  "in_transit",
  "arrived_at_destination",
  "out_for_delivery",
  "delivery_exception",
  "delivered",
] as const;
export type ShippingStatus = (typeof SHIPPING_STATUSES)[number];

export const HOLD_REASONS = [
  "customs_clearance_documentation_required",
  "customs_inspection",
  "shipping_documentation_review",
  "address_verification",
  "carrier_delay",
  "other",
] as const;
export type HoldReason = (typeof HOLD_REASONS)[number];

export const CONTROL_LABELS: Record<ControlStatus, string> = {
  active: "Active",
  on_hold: "On Hold",
  cancelled: "Cancelled",
  completed: "Completed",
};

export const PROCESSING_LABELS: Record<ProcessingStatus, string> = {
  order_received: "Order Received",
  payment_confirmed: "Payment Confirmed",
  processing: "Processing",
  preparing_order: "Preparing Order",
  order_verification: "Order Verification",
  ready_for_shipment: "Ready for Shipment",
  processing_complete: "Processing Complete",
};

export const SHIPPING_LABELS: Record<ShippingStatus, string> = {
  not_shipped: "Not Shipped",
  preparing_shipment: "Preparing Shipment",
  shipped: "Shipped",
  in_transit: "In Transit",
  arrived_at_destination: "Arrived at Destination",
  out_for_delivery: "Out for Delivery",
  delivery_exception: "Delivery Exception",
  delivered: "Delivered",
};

// Small, inline, real-life icons — kept distinct enough at a glance that
// "delivered" never reads as "not shipped yet" (both would otherwise be 📦).
export const SHIPPING_ICONS: Record<ShippingStatus, string> = {
  not_shipped: "📦",
  preparing_shipment: "📦",
  shipped: "🚚",
  in_transit: "🚛",
  arrived_at_destination: "📍",
  out_for_delivery: "🚗",
  delivery_exception: "⚠️",
  delivered: "🏠",
};

export const HOLD_REASON_LABELS: Record<HoldReason, string> = {
  customs_clearance_documentation_required: "Customs Clearance / Documentation Required",
  customs_inspection: "Customs Inspection",
  shipping_documentation_review: "Shipping Documentation Review",
  address_verification: "Address Verification",
  carrier_delay: "Carrier Delay",
  other: "Other",
};

export function processingStageIndex(status: ProcessingStatus): number {
  return PROCESSING_STATUSES.indexOf(status);
}

export function shippingStageIndex(status: ShippingStatus): number {
  return SHIPPING_STATUSES.indexOf(status);
}

export function isProcessingComplete(status: ProcessingStatus): boolean {
  return status === "processing_complete";
}

// The customer tracking page groups the pipeline into three connected
// sections (Order / Processing / Shipping) even though "order" and
// "processing" share one underlying DB column (processing_status) — this is
// a purely presentational split of PROCESSING_STATUSES, not a schema change.
export const ORDER_GROUP_STATUSES = ["order_received", "payment_confirmed"] as const satisfies readonly ProcessingStatus[];
export const PROCESSING_GROUP_STATUSES = [
  "processing",
  "preparing_order",
  "order_verification",
  "ready_for_shipment",
  "processing_complete",
] as const satisfies readonly ProcessingStatus[];

// Semantic color tone shared by every status badge/select across the admin
// and customer UI — one small set of meanings (positive/warning/info/
// negative/neutral) instead of ad-hoc colors picked per screen.
export type StatusTone = "positive" | "warning" | "info" | "negative" | "neutral";

export const TONE_CLASSES: Record<StatusTone, string> = {
  positive: "border-green-200 bg-green-50 text-green-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  negative: "border-red-200 bg-red-50 text-red-800",
  neutral: "border-gray-200 bg-white text-gray-700",
};

export const CONTROL_TONE: Record<ControlStatus, StatusTone> = {
  active: "neutral",
  on_hold: "warning",
  cancelled: "negative",
  completed: "positive",
};

export const PROCESSING_TONE: Record<ProcessingStatus, StatusTone> = {
  order_received: "neutral",
  payment_confirmed: "info",
  processing: "info",
  preparing_order: "info",
  order_verification: "warning",
  ready_for_shipment: "info",
  processing_complete: "positive",
};

export const SHIPPING_TONE: Record<ShippingStatus, StatusTone> = {
  not_shipped: "neutral",
  preparing_shipment: "neutral",
  shipped: "info",
  in_transit: "info",
  arrived_at_destination: "info",
  out_for_delivery: "info",
  delivery_exception: "negative",
  delivered: "positive",
};

// Legacy top-level `orders.status` (payment/lifecycle) — still used for the
// "Payment" field on the admin order page and the best-sellers RPC.
export const ORDER_STATUS_TONE: Record<string, StatusTone> = {
  pending: "neutral",
  processing: "info",
  paid: "positive",
  failed: "negative",
  shipped: "info",
  delivered: "positive",
  cancelled: "negative",
  refunded: "warning",
};

export function toneClass(tone: StatusTone): string {
  return TONE_CLASSES[tone];
}
