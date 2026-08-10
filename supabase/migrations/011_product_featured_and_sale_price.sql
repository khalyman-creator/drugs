-- Real, admin-controlled "Featured" flag and sale pricing — replaces the
-- previous "first 8 products by id" placeholder for the homepage Featured
-- section and adds an honest strikethrough/sale-badge data source.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC(12,2) NULL;

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_sale_price_check;

ALTER TABLE products
  ADD CONSTRAINT products_sale_price_check
  CHECK (sale_price IS NULL OR sale_price >= 0);

CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products (is_featured) WHERE is_featured = true;
