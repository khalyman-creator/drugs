-- Adds a real "when did this actually happen" timestamp to the order
-- timeline, independent of "when was this row inserted" (created_at).
-- Lets an admin log a status change after the fact (e.g. "this actually
-- shipped on the 5th") without corrupting the audit trail's insert order.

ALTER TABLE order_status_events ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ;

-- Backfill existing rows with their own created_at (NOT a blanket "now" —
-- must run as an UPDATE, since ADD COLUMN ... DEFAULT NOW() would stamp
-- every existing row with the migration's run time instead).
UPDATE order_status_events SET occurred_at = created_at WHERE occurred_at IS NULL;

ALTER TABLE order_status_events ALTER COLUMN occurred_at SET NOT NULL;
ALTER TABLE order_status_events ALTER COLUMN occurred_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_order_status_events_occurred_at ON order_status_events (order_id, occurred_at);
