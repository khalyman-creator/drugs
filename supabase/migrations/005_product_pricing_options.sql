-- Moves gram/button pricing tiers from one shared site_settings row to
-- per-product rows, so each product's tiers can be edited, relabeled, and
-- individually enabled/disabled from its own dashboard edit page.

CREATE TABLE IF NOT EXISTS product_pricing_options (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  unit_quantity NUMERIC(12, 3),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_pricing_options_product_id_idx
  ON product_pricing_options(product_id);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS allow_custom_quantity BOOLEAN NOT NULL DEFAULT true;

-- Backfill: give every existing gram-mode product (section_id 1-6) its own
-- copy of the current shared weight tiers.
INSERT INTO product_pricing_options (product_id, label, price, unit_quantity, sort_order)
SELECT p.id, s.gram_28g_label, s.gram_28g_price, 28, 0
FROM products p, site_settings s
WHERE p.section_id BETWEEN 1 AND 6 AND s.id = 1
UNION ALL
SELECT p.id, s.gram_qtr_label, s.gram_qtr_price, 113, 1
FROM products p, site_settings s
WHERE p.section_id BETWEEN 1 AND 6 AND s.id = 1
UNION ALL
SELECT p.id, s.gram_half_label, s.gram_half_price, 227, 2
FROM products p, site_settings s
WHERE p.section_id BETWEEN 1 AND 6 AND s.id = 1
UNION ALL
SELECT p.id, s.gram_1lb_label, s.gram_1lb_price, 454, 3
FROM products p, site_settings s
WHERE p.section_id BETWEEN 1 AND 6 AND s.id = 1;

-- Backfill: give every existing button-mode product (section_id 7-8) its own
-- copy of the current shared button tiers.
INSERT INTO product_pricing_options (product_id, label, price, unit_quantity, sort_order)
SELECT p.id, s.button_8_label, s.button_8_price, 8, 0
FROM products p, site_settings s
WHERE p.section_id BETWEEN 7 AND 8 AND s.id = 1
UNION ALL
SELECT p.id, s.button_16_label, s.button_16_price, 16, 1
FROM products p, site_settings s
WHERE p.section_id BETWEEN 7 AND 8 AND s.id = 1
UNION ALL
SELECT p.id, s.button_32_label, s.button_32_price, 32, 2
FROM products p, site_settings s
WHERE p.section_id BETWEEN 7 AND 8 AND s.id = 1
UNION ALL
SELECT p.id, s.button_64_label, s.button_64_price, 64, 3
FROM products p, site_settings s
WHERE p.section_id BETWEEN 7 AND 8 AND s.id = 1;
