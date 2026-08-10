-- Order tracking + admin shipment management.
-- Adds three independent status lanes on `orders` (control / processing /
-- shipping), a 1:1 `shipments` table for carrier/tracking/hold info, and an
-- append-only `order_status_events` table used as the customer/admin timeline.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS control_status TEXT NOT NULL DEFAULT 'active'
    CHECK (control_status IN ('active', 'on_hold', 'cancelled', 'completed')),
  ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'order_received'
    CHECK (processing_status IN (
      'order_received', 'payment_confirmed', 'processing', 'preparing_order',
      'order_verification', 'ready_for_shipment', 'processing_complete'
    )),
  ADD COLUMN IF NOT EXISTS shipping_status TEXT NOT NULL DEFAULT 'not_shipped'
    CHECK (shipping_status IN (
      'not_shipped', 'preparing_shipment', 'shipped', 'in_transit',
      'arrived_at_destination', 'out_for_delivery', 'delivery_exception', 'delivered'
    ));

CREATE INDEX IF NOT EXISTS idx_orders_control_status ON orders (control_status);
CREATE INDEX IF NOT EXISTS idx_orders_processing_status ON orders (processing_status);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON orders (shipping_status);

-- Customer-facing order references (e.g. "SLK-XXXXXXXX") are derived from the
-- first 8 hex characters of the UUID at read time (see order-ref.ts) — this
-- functional index lets /track-order look an order up by that same fragment.
CREATE INDEX IF NOT EXISTS idx_orders_ref_prefix ON orders (upper(left(id::text, 8)));

-- PostgREST can't filter on a computed expression directly, so /track-order
-- looks orders up through this thin read-only function (uses the index above).
CREATE OR REPLACE FUNCTION find_orders_by_reference_prefix(prefix TEXT)
RETURNS SETOF orders
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM orders WHERE upper(left(id::text, 8)) = upper(prefix);
$$;

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders (id) ON DELETE CASCADE,
  carrier TEXT,
  tracking_number TEXT,
  shipment_type TEXT,
  weight_value NUMERIC(10, 2),
  weight_unit TEXT,
  origin TEXT,
  destination TEXT,
  estimated_delivery DATE,
  hold_active BOOLEAN NOT NULL DEFAULT false,
  hold_reason TEXT
    CHECK (hold_reason IS NULL OR hold_reason IN (
      'customs_clearance_documentation_required', 'customs_inspection',
      'shipping_documentation_review', 'address_verification', 'carrier_delay', 'other'
    )),
  hold_customer_message TEXT,
  hold_internal_note TEXT,
  hold_placed_at TIMESTAMPTZ,
  delivery_exception_reason TEXT,
  delivery_exception_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
    CHECK (event_type IN (
      'control_status', 'processing_status', 'shipping_status',
      'hold_placed', 'hold_released', 'delivery_exception_set', 'delivery_exception_resolved'
    )),
  previous_value TEXT,
  new_value TEXT,
  -- Internal-only note (e.g. hold internal note) — never selected by the
  -- public /api/track-order route, regardless of event_type.
  reason TEXT,
  -- Customer-facing message — safe to expose publicly.
  customer_message TEXT,
  created_by TEXT NOT NULL DEFAULT 'admin' CHECK (created_by IN ('admin', 'system')),
  -- Claim column for the idempotent email-send pattern (mirrors
  -- payments.metadata's *_email_sent_at keys, but per-event since hold/
  -- exception events can legitimately recur on the same order).
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_events_order_id ON order_status_events (order_id, created_at);
CREATE INDEX IF NOT EXISTS idx_order_status_events_type ON order_status_events (event_type);

-- Backfill existing orders so the new lanes reflect where each order
-- actually is today, and control_status captures orders that were already
-- cancelled/refunded under the old single-status field.
UPDATE orders SET processing_status = 'payment_confirmed'
  WHERE status = 'paid' AND processing_status = 'order_received';
UPDATE orders SET processing_status = 'processing_complete', shipping_status = 'shipped'
  WHERE status = 'shipped';
UPDATE orders SET processing_status = 'processing_complete', shipping_status = 'delivered'
  WHERE status = 'delivered';
UPDATE orders SET control_status = 'cancelled'
  WHERE status IN ('cancelled', 'refunded');

-- Seed a synthetic timeline for pre-existing orders so the new admin/
-- customer timeline isn't empty the first time it's opened. Guarded against
-- re-running this migration (e.g. replaying all migrations on a fresh DB).
INSERT INTO order_status_events (order_id, event_type, previous_value, new_value, created_by, created_at)
SELECT o.id, 'processing_status', NULL, 'order_received', 'system', o.created_at
FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM order_status_events e
  WHERE e.order_id = o.id AND e.event_type = 'processing_status' AND e.new_value = 'order_received'
);

INSERT INTO order_status_events (order_id, event_type, previous_value, new_value, created_by, created_at)
SELECT o.id, 'processing_status', 'order_received', 'payment_confirmed', 'system', o.updated_at
FROM orders o
WHERE o.processing_status IN ('payment_confirmed', 'processing_complete')
  AND NOT EXISTS (
    SELECT 1 FROM order_status_events e
    WHERE e.order_id = o.id AND e.event_type = 'processing_status' AND e.new_value = 'payment_confirmed'
  );
