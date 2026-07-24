-- Adds dashboard-editable fields for Featured Products / Testimonials headings
-- and the Shipping/Refund policy pages, so none of this content is hardcoded.

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS featured_products_title TEXT NOT NULL DEFAULT 'Featured Products',
  ADD COLUMN IF NOT EXISTS featured_products_subtitle TEXT NOT NULL DEFAULT 'The pieces everyone''s asking about right now.',
  ADD COLUMN IF NOT EXISTS testimonials_title TEXT NOT NULL DEFAULT 'The Cosign',
  ADD COLUMN IF NOT EXISTS testimonials_subtitle TEXT NOT NULL DEFAULT 'No paid actors, no scripts — just people who copped and came back.',
  ADD COLUMN IF NOT EXISTS shipping_policy_text TEXT NOT NULL DEFAULT '## Processing time
Orders are processed within 1–3 business days. You''ll get a confirmation email as soon as your order is placed, and another once it ships.

## Shipping methods & delivery times
Standard shipping: 5–9 business days
Express shipping: 2–4 business days

Delivery estimates start counting from the day an order ships, not the day it''s placed.

## Shipping costs
Standard shipping is a flat $10. Express shipping is a flat $20. Pick your method at checkout.

## Tracking your order
Once your order ships, you''ll receive a tracking number by email so you can follow it the whole way.

## Where we ship
We currently ship within the United States. Reach out via the contact page if you need something delivered elsewhere and we''ll see what we can do.',
  ADD COLUMN IF NOT EXISTS refund_policy_text TEXT NOT NULL DEFAULT '## Returns
You have 30 days from the delivery date to request a return. To be eligible, items must be unused, unworn, and in their original packaging with tags attached.

## Non-returnable items
For hygiene reasons, opened beauty and personal care items can''t be returned unless they arrived damaged or defective.

## How to start a return
Message us on the contact page with your order number and what you''re returning. We''ll send you instructions on where to send it back.

## Refunds
Once your return is received and inspected, we''ll email you to confirm it''s approved. Refunds are issued to your original payment method and typically post within 5–10 business days.

## Damaged or wrong items
If something arrives damaged or isn''t what you ordered, contact us within 48 hours of delivery and we''ll sort out a replacement or full refund — no return shipping required.

## Exchanges
Need a different size or color? Start a return for the original item and place a new order — that''s the fastest way to get the right one to you.';
