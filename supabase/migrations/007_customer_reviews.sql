-- Replaces the fixed 3-slot testimonial fields with a real, moderated
-- customer review system: anyone can submit a review, it stays hidden
-- until approved from the dashboard.

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  comment TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_is_approved_idx ON reviews(is_approved);

-- Carry the existing 3 hardcoded testimonials over as pre-approved reviews
-- so the section doesn't go empty the moment this ships.
INSERT INTO reviews (name, comment, is_approved)
SELECT s.testimonial_1_name, s.testimonial_1_text, true
FROM site_settings s
WHERE s.id = 1 AND trim(s.testimonial_1_name) <> '' AND trim(s.testimonial_1_text) <> ''
UNION ALL
SELECT s.testimonial_2_name, s.testimonial_2_text, true
FROM site_settings s
WHERE s.id = 1 AND trim(s.testimonial_2_name) <> '' AND trim(s.testimonial_2_text) <> ''
UNION ALL
SELECT s.testimonial_3_name, s.testimonial_3_text, true
FROM site_settings s
WHERE s.id = 1 AND trim(s.testimonial_3_name) <> '' AND trim(s.testimonial_3_text) <> '';
