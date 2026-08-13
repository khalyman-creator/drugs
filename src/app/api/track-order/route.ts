import { NextRequest, NextResponse } from "next/server";
import { findOrdersByReferencePrefix, type OrderWithDetails } from "@/lib/db/supabase-orders";
import { getShipmentByOrderId } from "@/lib/db/supabase-shipments";
import { listOrderStatusEvents } from "@/lib/db/supabase-order-events";
import { formatOrderReference, formatEmailDate } from "@/lib/email/order-ref";
import { HOLD_REASON_LABELS, SHIPMENT_FIELD_KEYS, type ShipmentFieldKey } from "@/lib/shipping-status";
import type { ShipmentRecord } from "@/lib/db/supabase-shipments";

/** Applies the admin's whole-section and per-field visibility choices before anything reaches the customer. */
function buildShipmentPayload(shipment: ShipmentRecord | null) {
  if (!shipment || !shipment.show_shipment_details) return null;

  const hidden = new Set(shipment.hidden_fields);
  const full: Record<ShipmentFieldKey, string | null> = {
    carrier: shipment.carrier,
    trackingNumber: shipment.tracking_number,
    shipmentType: shipment.shipment_type,
    weight:
      shipment.weight_value != null
        ? `${shipment.weight_value}${shipment.weight_unit ? ` ${shipment.weight_unit}` : ""}`
        : null,
    origin: shipment.origin,
    destination: shipment.destination,
    estimatedDelivery: shipment.estimated_delivery,
  };

  for (const key of SHIPMENT_FIELD_KEYS) {
    if (hidden.has(key)) full[key] = null;
  }

  return full;
}

const REF_PATTERN = /^[0-9A-F]{8}$/;

function normalizeReference(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const stripped = raw.trim().toUpperCase().replace(/^[A-Z]+-/, "");
  return REF_PATTERN.test(stripped) ? stripped : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const reference = normalizeReference(body?.reference);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!reference) {
    return NextResponse.json(
      { error: "Enter a valid order reference (e.g. SLK-XXXXXXXX)." },
      { status: 400 }
    );
  }

  let matches: OrderWithDetails[];
  try {
    matches = await findOrdersByReferencePrefix(reference);
  } catch {
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }

  if (matches.length === 0) {
    return NextResponse.json({ error: "No order found for that reference." }, { status: 404 });
  }

  if (matches.length > 1) {
    if (!email) {
      return NextResponse.json(
        {
          error: "Multiple orders match — enter the email used at checkout to narrow it down.",
          requiresEmail: true,
        },
        { status: 409 }
      );
    }
    matches = matches.filter((o) => o.customer?.email?.toLowerCase() === email);
  } else if (email) {
    // Caller supplied an email even though there's only one match — verify
    // it rather than silently ignoring it, so a wrong email never returns
    // someone else's order.
    matches = matches.filter((o) => o.customer?.email?.toLowerCase() === email);
  }

  const order = matches[0];
  if (!order) {
    return NextResponse.json({ error: "No order found for that reference and email." }, { status: 404 });
  }

  const [shipment, events] = await Promise.all([
    getShipmentByOrderId(order.id),
    listOrderStatusEvents(order.id),
  ]);

  const customer = order.customer;

  return NextResponse.json({
    orderRef: formatOrderReference(order.id),
    createdAt: order.created_at,
    createdAtFormatted: formatEmailDate(order.created_at),
    controlStatus: order.control_status,
    processingStatus: order.processing_status,
    shippingStatus: order.shipping_status,
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    total: Number(order.total),
    items: order.items.map((item) => ({
      name: item.name,
      image: item.image,
      category: item.category,
      quantity: item.quantity,
      unitPrice: Number(item.price),
      lineTotal: Number(item.price) * item.quantity,
    })),
    receiver: customer
      ? {
          name: customer.full_name || null,
          address: customer.shipping_address || null,
          phone: customer.phone || null,
        }
      : null,
    shipment: buildShipmentPayload(shipment),
    // Which keys the admin deliberately hid (as opposed to just not filled
    // in yet) — sent separately from the values themselves, which are
    // already nulled out above, so the client can omit that row entirely
    // instead of showing a misleading "Pending" for something intentionally
    // redacted.
    shipmentHiddenFields: shipment?.show_shipment_details ? shipment.hidden_fields : [],
    hold:
      shipment?.hold_active && shipment.hold_reason
        ? {
            reason: HOLD_REASON_LABELS[shipment.hold_reason],
            message: shipment.hold_customer_message,
          }
        : null,
    deliveryException:
      order.shipping_status === "delivery_exception" && shipment?.delivery_exception_reason
        ? {
            reason: shipment.delivery_exception_reason,
            since: shipment.delivery_exception_at,
          }
        : null,
    timeline: events.map((e) => ({
      eventType: e.event_type,
      previousValue: e.previous_value,
      newValue: e.new_value,
      customerMessage: e.customer_message,
      createdAt: e.created_at,
      occurredAt: e.occurred_at,
    })),
  });
}
