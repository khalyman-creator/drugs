-- Lets an admin hide the entire "Shipment Information" section on the
-- customer tracking page for a specific order, or hide individual fields
-- within it (e.g. carrier known but tracking number not yet confirmed),
-- without touching the underlying data.

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS show_shipment_details BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hidden_fields TEXT[] NOT NULL DEFAULT '{}';
