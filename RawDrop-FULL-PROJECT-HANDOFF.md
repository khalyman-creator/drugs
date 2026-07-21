# RawDrop — Complete Project Handoff Document

**Generated:** July 2, 2026  
**Purpose:** Give this file to any AI or developer so they can continue the project without re-explaining everything.

---

## 1. Project Summary

**Brand name:** RawDrop  
**Type:** Shopify-style e-commerce store (50 products, 9 sections, reviews, admin, cart, crypto checkout)  
**GitHub repo:** https://github.com/khalyman-creator/drugs (branch: `main`)  
**Live deploy target:** Cloudflare Worker named **`drugs`**  
**Live URL (configured):** https://drugs.khalyman-creator.workers.dev  

### Local project folders (IMPORTANT on Windows)

There are two paths that may point to the same project:

| Path | Notes |
|------|-------|
| `C:\Users\solution info\Downloads\new app` | Current workspace / synced copy |
| `E:\LaptopArchive\Downloads\new app` | **Preferred for builds/deploy** — mixed C:/E: paths break Next.js/OpenNext on Windows |

**Rule:** Run `npm run dev`, `npm run build`, and `npm run deploy:cloudflare` from **one consistent drive** (preferably E:).

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Local data | JSON file store (`data/store.json`) — NOT SQLite anymore |
| Reviews | JSON file (`data/reviews.json`) |
| Cart | Browser localStorage (`local-shop-cart`) |
| Production orders | Supabase PostgreSQL |
| Payments | NOWPayments (crypto invoices) |
| Contact form email | Resend API → admin inbox |
| Deploy | OpenNext + Cloudflare Workers (`@opennextjs/cloudflare`) |

---

## 3. What Was Built (Feature List)

### Storefront
- [x] Home page with hero, featured products, about, testimonials
- [x] 50 products across 9 sections
- [x] Product detail pages with reviews (star ratings, load more)
- [x] Products listing page (`/products`)
- [x] Home redirects to shopping experience
- [x] Header with cart count, footer with links
- [x] Contact page (`/contact`) — form sends to admin email without exposing email publicly

### Cart & Checkout
- [x] Add to cart / Buy now
- [x] Cart page with remove items
- [x] Checkout form (name, email, address, city, zip)
- [x] NOWPayments crypto redirect on checkout
- [x] Success page (`/success`)
- [x] Order lookup page (`/order/[orderNumber]`)
- [x] Minimum checkout: **$20**

### Section-based pricing (latest work — IN PROGRESS but builds)
- [x] **Sections 1–6:** Gram dropdown (28g, 1/4 lb, 1/2 lb, 1 lb, custom grams)
- [x] **Sections 7–8:** Button dropdown (8, 16, 32, 64, custom buttons)
- [x] **Section 9:** Standard +/- quantity (placeholder — user said sections 9–10 need different logic later)
- [ ] **Section 10:** Does not exist yet (only 9 sections currently)
- [x] Product cards show "From $200" or "From $150" where applicable
- [x] Server-side price validation on checkout (`validate-items.ts`)

### Admin
- [x] Admin login (`/admin/login`) — username: `admin`, password: `admin123`
- [x] Dashboard to edit site settings, sections, products, view orders
- [x] REST API routes for products, sections, settings, orders

### Reviews
- [x] Seeded reviews per product (`data/reviews.json`)
- [x] Review summaries (average rating, count)
- [x] Script: `npm run seed-reviews`

### Payments & Backend (code written, not fully live)
- [x] `POST /api/checkout` — creates Supabase order + NOWPayments invoice
- [x] `POST /api/payments/webhook/nowpayments` — HMAC-SHA512 webhook handler
- [x] `GET /api/public/store-config` — returns `checkoutReady`, config flags
- [x] `POST /api/contact` — contact form via Resend
- [ ] **Live checkout not ready** until secrets + Supabase migration are complete

---

## 4. Product Sections (9 total)

| Section ID | Name | Products | Pricing mode |
|------------|------|----------|--------------|
| 1 | New Arrivals | 5 (IDs 1–5) | Grams |
| 2 | Best Sellers | 5 (IDs 6–10) | Grams |
| 3 | Electronics | 5 (IDs 11–15) | Grams |
| 4 | Fashion & Apparel | 5 (IDs 16–20) | Grams |
| 5 | Home & Living | 5 (IDs 21–25) | Grams |
| 6 | Beauty & Personal Care | 5 (IDs 26–30) | Grams |
| 7 | Sports & Outdoors | 5 (IDs 31–35) | Buttons |
| 8 | Accessories | 5 (IDs 36–40) | Buttons |
| 9 | Clearance & Special Offers | 10 (IDs 41–50) | Standard qty (TBD custom logic) |

Product-to-section mapping logic in `src/lib/db.ts`:
```ts
function sectionForProductIndex(index: number): number {
  if (index >= 40) return 9;  // products 41–50 → section 9
  return Math.floor(index / 5) + 1;
}
```

---

## 5. Pricing Rules (Implemented in `src/lib/pricing.ts`)

### Sections 1–6 — Grams

| Option | Label | Price |
|--------|-------|-------|
| 28g | 28g | **$200** (minimum) |
| 1/4p | 1/4 lb (113g) | **$250** |
| 1/2p | 1/2 lb (227g) | **$500** |
| 1p | 1 lb (454g) | **$1,000** |
| custom | Custom grams | `max($200, grams × 200/28)` for ≥28g; under 28g = $200 min |

Display on product cards/pages: **From $200**

### Sections 7–8 — Buttons

| Option | Label | Price |
|--------|-------|-------|
| 8 | 8 buttons | **$150** (minimum) |
| 16 | 16 buttons | **$280** |
| 32 | 32 buttons | **$540** |
| 64 | 64 buttons | **$1,000** |
| custom | Custom buttons | `max($150, buttons × 150/8)` for ≥8; under 8 = $150 min |

Display: **From $150**

### Section 9 — Standard

- Base price: **$200/unit**
- Uses +/- quantity selector
- User requested "something else" for sections 9 and 10 — **NOT YET DEFINED**

### Key pricing files
- `src/lib/pricing.ts` — tier math, `getPricingMode()`, `resolveGramSelection()`, `resolveButtonSelection()`, `recalculateLinePrice()`
- `src/components/SectionQuantityPicker.tsx` — dropdown UI for grams/buttons
- `src/lib/cart.ts` — cart items use `lineKey` = `{productId}::{variantLabel}`
- `src/lib/checkout/validate-items.ts` — server recalculates prices from variant labels (anti-tampering)

---

## 6. Project File Structure

```
new app/
├── data/
│   ├── store.json          # Local products, sections, settings, orders (gitignored)
│   └── reviews.json        # Product reviews
├── public/
│   └── placeholder.svg
├── scripts/
│   ├── apply-supabase-migration.mjs
│   ├── EASY-SETUP.ps1
│   ├── finish-rawdrop-deploy.ps1
│   ├── free-port.js          # Kills port 3000 before dev
│   ├── seed-reviews.ts
│   ├── set-drugs-cloudflare-env.ps1
│   ├── setup-rawdrop-supabase.mjs
│   └── wire-supabase-to-rawdrop.ps1
├── src/
│   ├── app/
│   │   ├── admin/            # Admin dashboard + login
│   │   ├── api/
│   │   │   ├── auth/login/
│   │   │   ├── checkout/     # NOWPayments checkout
│   │   │   ├── contact/      # Contact form
│   │   │   ├── orders/
│   │   │   ├── payments/webhook/nowpayments/
│   │   │   ├── products/
│   │   │   ├── public/store-config/
│   │   │   ├── reviews/
│   │   │   ├── sections/
│   │   │   └── settings/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── contact/
│   │   ├── order/[orderNumber]/
│   │   ├── product/[slug]/
│   │   ├── products/
│   │   └── success/
│   ├── components/
│   │   ├── CartProvider.tsx
│   │   ├── ProductPageClient.tsx
│   │   ├── ProductCard.tsx
│   │   ├── SectionQuantityPicker.tsx
│   │   └── ...
│   └── lib/
│       ├── db.ts             # Local JSON store
│       ├── pricing.ts        # Section pricing logic
│       ├── cart.ts
│       ├── env.ts            # Environment variable helpers
│       ├── checkout/
│       ├── payments/nowpayments/
│       ├── supabase/
│       └── email/send-contact.ts
├── supabase/
│   └── migrations/001_initial_schema.sql
├── wrangler.jsonc            # Cloudflare Worker config (name: drugs)
├── open-next.config.ts
├── SETUP.bat
├── START.bat
└── package.json
```

---

## 7. How to Run Locally

```powershell
cd "E:\LaptopArchive\Downloads\new app"   # or C:\Users\solution info\Downloads\new app
npm install
npm run dev
```

Open: http://localhost:3000

### Admin
- URL: http://localhost:3000/admin/login
- Username: `admin`
- Password: `admin123`

### Build (verified working as of last session)
```powershell
npm run build
```

---

## 8. Environment Variables

### Required for full live checkout

| Variable | Purpose | Where to set |
|----------|---------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | wrangler vars (set) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key | wrangler vars (set) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase access | **Wrangler secret — NOT SET YET** |
| `NOWPAYMENTS_API_KEY` | NOWPayments API | Wrangler secret |
| `NOWPAYMENTS_IPN_SECRET` | Webhook HMAC verification | Wrangler secret |
| `RESEND_API_KEY` | Contact form emails | Wrangler secret |
| `NEXT_PUBLIC_SITE_URL` | Site URL for redirects | wrangler vars (set) |
| `ADMIN_EMAIL` | Receives contact form | wrangler vars (set) |
| `EMAIL_FROM` | Sender for Resend | wrangler vars (set) |

### Local dev secrets file
`.dev.vars` (gitignored) — used by wrangler/next during local dev. Contains Supabase URL + publishable key.

### Checkout readiness check
```bash
curl https://drugs.khalyman-creator.workers.dev/api/public/store-config
```
Returns:
```json
{
  "checkoutReady": false,   // true when Supabase service role + NOWPayments both configured
  "supabaseConfigured": false,
  "nowpaymentsConfigured": false,
  "siteUrl": "...",
  "brand": "RawDrop"
}
```

Logic in `src/lib/env.ts`:
- `isCheckoutReady()` = Supabase configured AND NOWPayments configured
- Supabase "configured" requires real `SUPABASE_SERVICE_ROLE_KEY` (not placeholder)

---

## 9. Supabase

| Setting | Value |
|---------|-------|
| Project ref | `vjxjhwzfcdwuwhgiinrk` |
| URL | `https://vjxjhwzfcdwuwhgiinrk.supabase.co` |
| Publishable key | In `wrangler.jsonc` vars |
| Service role key | User must add as Cloudflare secret |
| Migration file | `supabase/migrations/001_initial_schema.sql` |
| Migration status | **NOT CONFIRMED APPLIED** |

### Tables (from migration)
- `customers`
- `orders`
- `order_items`
- `payments`

### Apply migration options
1. Supabase Dashboard → SQL Editor → paste `001_initial_schema.sql`
2. Run `node scripts/apply-supabase-migration.mjs` (needs Supabase access token)
3. Supabase MCP (configured in `.cursor/mcp.json` but was not active in agent sessions)

---

## 10. Cloudflare Deployment

### Worker config (`wrangler.jsonc`)
```json
{
  "name": "drugs",
  "account_id": "80dde3ce8f942ae41c4ded3ff35ef2c6",
  "main": ".open-next/worker.js"
}
```

### Deploy commands
```powershell
npm run pages:build
npm run pages:deploy
# or combined:
npm run deploy:cloudflare
```

### Known deploy blocker
Wrangler CLI was logged into a **different Cloudflare account** (`3b52f2f4…`) than the drugs account (`80dde3ce…`). User must:
```powershell
npx wrangler login
# Select account 80dde3ce8f942ae41c4ded3ff35ef2c6
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put NOWPAYMENTS_API_KEY
npx wrangler secret put NOWPAYMENTS_IPN_SECRET
npx wrangler secret put RESEND_API_KEY
npm run deploy:cloudflare
```

Or paste secrets manually in Cloudflare Dashboard → Workers → drugs → Settings → Variables.

---

## 11. Payment Flow (Code Path)

1. User fills checkout form → `POST /api/checkout`
2. `validate-items.ts` recalculates prices from catalog + variant labels
3. Order saved to Supabase (`supabase-orders.ts`, `supabase-customers.ts`)
4. NOWPayments invoice created (`src/lib/payments/nowpayments/client.ts`)
5. User redirected to NOWPayments payment URL
6. Webhook `POST /api/payments/webhook/nowpayments` updates payment + order status
7. User lands on `/success?orderId=...`

Minimum order: **$20** (enforced client + server)

---

## 12. Contact Page

- Route: `/contact`
- API: `POST /api/contact`
- Sends email via Resend to `ADMIN_EMAIL` (hcbydrsyckucbktdyrhxji31@gmail.com)
- Email is **not shown** on the public site (footer link only)
- Requires `RESEND_API_KEY` secret to work in production

---

## 13. Cart Data Model

```typescript
type CartItem = {
  lineKey: string;           // "{productId}::{variantLabel}"
  product_id: number;
  slug: string;
  name: string;              // includes variant in name, e.g. "Product — 28g"
  price: number;             // calculated from pricing tier
  image_url: string;
  quantity: number;
  variant_label: string;     // e.g. "28g", "8 buttons", "56g (custom)"
  section_id: number;
};
```

Storage key: `local-shop-cart` in localStorage

---

## 14. API Routes Reference

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/products` | List all products |
| GET | `/api/products/[slug]` | Single product |
| GET | `/api/sections` | All sections |
| GET | `/api/settings` | Site settings |
| GET | `/api/reviews?productId=N` | Product reviews |
| POST | `/api/auth/login` | Admin login |
| POST | `/api/checkout` | Create order + payment |
| POST | `/api/contact` | Contact form |
| GET | `/api/orders` | Admin: list orders |
| GET | `/api/orders/lookup?orderNumber=` | Order lookup |
| POST | `/api/payments/webhook/nowpayments` | Payment webhook |
| GET | `/api/public/store-config` | Public config flags |

---

## 15. User Requests Chronology

1. Build local Shopify-style store → evolved into **RawDrop**
2. 50 products, 9 sections, reviews, admin, cart, checkout
3. NOWPayments + Supabase on Cloudflare Worker
4. Worker name: **`drugs`** (NOT rawdrop — rawdrop was earlier name)
5. Do NOT touch other live workers or shared Supabase DBs
6. Site email: hcbydrsyckucbktdyrhxji31@gmail.com
7. Contact page without exposing email publicly
8. Supabase project: vjxjhwzfcdwuwhgiinrk
9. **Latest request:** Section-based quantity/pricing:
   - Sections 1–6: grams dropdown ($200–$1000+)
   - Sections 7–8: buttons dropdown ($150–$1000)
   - Sections 9–10: "something else" — **NOT DONE** (only 9 sections exist; section 9 uses standard qty for now)

---

## 16. What's DONE vs REMAINING

### Done
- Full storefront UI
- Local JSON store with 50 products + 9 sections
- Reviews system
- Admin dashboard
- Cart with variant-aware line keys
- Section pricing UI (grams/buttons dropdowns)
- Server-side price validation
- NOWPayments + Supabase code
- Contact page
- OpenNext/Cloudflare config
- `npm run build` passes

### Remaining (priority order)

1. **Define + implement section 9 (and section 10 if added) custom pricing**
2. **Set Cloudflare secrets** on correct account (`80dde3ce…`)
3. **Apply Supabase migration** (`001_initial_schema.sql`)
4. **Deploy** to drugs worker
5. **Verify** `checkoutReady: true` at `/api/public/store-config`
6. **Test** full checkout flow (≥$20 → NOWPayments redirect → webhook)
7. **Update README.md** — still says SQLite and $1000 default prices (outdated)

---

## 17. Errors Fixed During Development

| Problem | Fix |
|---------|-----|
| SQLite stuck on Windows | Switched to JSON file store (`data/store.json`) |
| Port 3000 in use | `scripts/free-port.js` runs before dev |
| OpenNext path errors on Windows | Run from E: drive consistently |
| `useSearchParams` build error | Checkout wrapped in Suspense |
| Cart API breaking change | Updated to `lineKey` instead of `product_id` for remove/update |
| ProductPageClient `sectionId` undefined | Fixed to use `product.section_id` |
| ProductDetail.tsx type error | Updated to new cart API + SectionQuantityPicker |
| defaultStore missing `image_url` | Restored in db.ts loop |

---

## 18. Security Notes

- **Never commit:** `.dev.vars`, `.rawdrop-supabase.json`, API keys
- Live API keys (NOWPayments, Resend, Supabase service role) appeared in chat history — rotate if concerned
- Admin default password `admin123` — change in production
- `data/store.json` is gitignored (contains admin password hash)

---

## 19. npm Scripts

```json
"predev": "node scripts/free-port.js 3000"
"dev": "next dev -p 3000"
"build": "next build"
"start": "next start"
"seed-reviews": "tsx scripts/seed-reviews.ts"
"lint": "next lint"
"pages:build": "npx opennextjs-cloudflare build"
"pages:deploy": "npx opennextjs-cloudflare deploy"
"deploy:cloudflare": "npm run pages:build && npm run pages:deploy"
```

---

## 20. Quick Start for Next Developer/AI

```
1. cd to project folder (prefer E:\LaptopArchive\Downloads\new app)
2. npm install
3. npm run dev → test at localhost:3000
4. npm run build → confirm no errors
5. Apply supabase/migrations/001_initial_schema.sql
6. wrangler login → correct Cloudflare account (80dde3ce8f942ae41c4ded3ff35ef2c6)
7. Set wrangler secrets (SUPABASE_SERVICE_ROLE_KEY, NOWPAYMENTS_*, RESEND_API_KEY)
8. npm run deploy:cloudflare
9. Verify GET /api/public/store-config → checkoutReady: true
10. Implement section 9/10 pricing per user's spec
11. Change admin password
```

---

## 21. Key Code Entry Points

| Task | Start here |
|------|------------|
| Change pricing tiers | `src/lib/pricing.ts` |
| Change quantity UI | `src/components/SectionQuantityPicker.tsx` |
| Product page add-to-cart | `src/components/ProductPageClient.tsx` |
| Local product data | `src/lib/db.ts` + `data/store.json` |
| Checkout logic | `src/app/api/checkout/route.ts` + `src/lib/checkout/` |
| Payment provider | `src/lib/payments/nowpayments/client.ts` |
| Env / config flags | `src/lib/env.ts` |
| Cloudflare deploy | `wrangler.jsonc` + `open-next.config.ts` |
| Supabase schema | `supabase/migrations/001_initial_schema.sql` |

---

## 22. Contact / Account Info

- **Admin email:** hcbydrsyckucbktdyrhxji31@gmail.com
- **GitHub:** khalyman-creator / drugs repo
- **Cloudflare account ID:** 80dde3ce8f942ae41c4ded3ff35ef2c6
- **Worker name:** drugs
- **Supabase project:** vjxjhwzfcdwuwhgiinrk

---

*End of handoff document. Give this file + the project folder to continue development.*
