-- Adds a dashboard-editable, rotating announcement bar shown above the
-- header on every storefront page.

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS announcement_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS announcement_messages TEXT NOT NULL DEFAULT 'Free shipping on every order
New drops added weekly
Secure checkout, every time';
