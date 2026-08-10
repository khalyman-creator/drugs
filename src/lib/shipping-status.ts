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
