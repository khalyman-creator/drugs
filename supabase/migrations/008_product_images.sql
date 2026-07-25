-- Lets each product have a variable number of extra photos (a gallery),
-- in addition to its existing primary image_url (used as the cover/thumbnail
-- everywhere else on the site).

CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON product_images(product_id);
