# Local Shop

A simple local Shopify-style store with 50 products, instant product landing, cart, checkout, and an easy admin dashboard.

## Quick Start

Open a terminal **in this project folder** and run:

```bash
npm install
npm run dev
```

Open **http://localhost:3000** — you'll land directly on the first product page.

> If you see path errors, run the commands from the real project folder on disk (not a synced shortcut path).

## Admin Dashboard

- URL: **http://localhost:3000/admin/login**
- Username: `admin`
- Password: `admin123`

From the dashboard you can edit **everything**:

- **Site tab** — store name, tagline, page titles, footer
- **Sections tab** — rename all 9 sections
- **Products tab** — name, description, image, price, move to different section
- **Orders tab** — view all orders

## Product layout

50 products split into **9 sections**:
- Sections 1–8: **5 products each**
- Section 9 (last): **10 products**

## Store Flow

1. **Home (`/`)** → redirects instantly to first product
2. **Product page** (`/product/product-1-1`) → shareable direct links
3. **All products** (`/products`) → browse all 50 items
4. **Cart** → add/remove/change quantity
5. **Checkout** → fill shipping info, place order
6. **Order page** (`/order/ORD-...`) → confirmation with full details

Every product is **$1,000** by default.

## Tech

- Next.js 15 + TypeScript + Tailwind
- SQLite (local `data/shop.db` — auto-created on first run)
- Cart stored in browser localStorage
