import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import type { Product, Order, OrderItem, Section, SiteSettings, SectionWithProducts } from "./types";
import { seedReviewsIfNeeded } from "./reviews";

export type { Product, Order, OrderItem, Section, SiteSettings, SectionWithProducts };

function findProjectRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const pkg = path.join(dir, "package.json");
    const data = path.join(dir, "data");
    if (fs.existsSync(pkg) && fs.existsSync(data)) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

const DATA_DIR = path.join(findProjectRoot(), "data");
const DB_FILE = path.join(DATA_DIR, "store.json");

type Store = {
  products: Product[];
  sections: Section[];
  settings: SiteSettings;
  orders: Order[];
  order_items: OrderItem[];
  admin: { username: string; password_hash: string };
  nextProductId: number;
  nextOrderId: number;
  nextOrderItemId: number;
};

function slugify(name: string, id: number): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${id}`;
}

function defaultSettings(): SiteSettings {
  return {
    store_name: "RawDrop",
    tagline: "Curated products. Trusted checkout. Fast delivery.",
    products_page_title: "Shop the Collection",
    products_page_subtitle: "Browse by category — every item backed by verified customer reviews.",
    footer_text: "© RawDrop. All rights reserved.",
    hero_title: "Shop With Confidence",
    hero_subtitle:
      "Discover our full catalog of quality products. Read reviews, compare options, and checkout in minutes.",
    hero_button_text: "Browse Products",
    hero_image_url:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&h=700&fit=crop",
    about_title: "About RawDrop",
    about_text:
      "RawDrop is an online store built around transparency and customer satisfaction. Every product listing includes detailed descriptions, verified reviews, and secure checkout. We focus on quality, clear pricing, and reliable service from cart to delivery.",
    contact_email: "support@rawdrop.com",
    contact_phone: "+1 (555) 987-6543",
    testimonial_1_name: "Marcus T.",
    testimonial_1_text:
      "Ordering was straightforward and the product matched the description exactly. Would buy again.",
    testimonial_2_name: "Jaylen K.",
    testimonial_2_text:
      "Reviews helped me choose the right item. Checkout was quick and my order arrived on time.",
    testimonial_3_name: "Destiny R.",
    testimonial_3_text:
      "Professional experience top to bottom. Customer support was responsive and helpful.",
    btc_wallet_address: "",
    btc_payment_enabled: false,
  };
}

const SECTION_NAMES = [
  "New Arrivals",
  "Best Sellers",
  "Electronics",
  "Fashion & Apparel",
  "Home & Living",
  "Beauty & Personal Care",
  "Sports & Outdoors",
  "Accessories",
  "Clearance & Special Offers",
];

const PRODUCT_CATALOG: { name: string; description: string }[] = [
  // New Arrivals (1–5)
  { name: "Essential Cotton Tee — White", description: "A wardrobe staple crafted from soft, breathable cotton. Relaxed fit with reinforced stitching for everyday wear. Machine washable. Available for customization in your dashboard." },
  { name: "Slim Fit Denim Jacket", description: "Classic denim jacket with a modern slim silhouette. Durable wash, metal hardware, and functional chest pockets. Layer over any outfit for a polished casual look." },
  { name: "Minimalist Watch — Silver", description: "Clean analog design with a stainless steel case and adjustable link band. Water-resistant for daily use. Includes presentation box — ideal for gifting." },
  { name: "Everyday Crossbody Bag", description: "Compact crossbody with adjustable strap, interior zip pocket, and secure magnetic closure. Fits phone, wallet, and essentials. Lightweight for all-day carry." },
  { name: "Performance Running Cap", description: "Lightweight cap with moisture-wicking fabric and adjustable back strap. UV protection for outdoor training. One size fits most." },
  // Best Sellers (6–10)
  { name: "Wireless Earbuds Pro", description: "True wireless earbuds with active noise cancellation, 24-hour battery life with case, and touch controls. Includes three ear tip sizes for a secure fit." },
  { name: "Insulated Water Bottle — 32oz", description: "Double-wall vacuum insulation keeps drinks cold 24 hours or hot 12 hours. BPA-free stainless steel, leak-proof lid, fits standard cup holders." },
  { name: "Organic Face Moisturizer", description: "Daily moisturizer with hyaluronic acid and vitamin E. Lightweight, non-greasy formula suitable for all skin types. Dermatologist tested, fragrance-free." },
  { name: "Leather Belt — Brown", description: "Full-grain leather belt with brushed nickel buckle. 1.25-inch width, suitable for casual and business attire. Available in standard waist sizes." },
  { name: "Portable Phone Charger 10K", description: "10,000mAh power bank with USB-C and USB-A outputs. Fast-charge compatible. LED indicator shows remaining power. TSA-approved for travel." },
  // Electronics (11–15)
  { name: "Bluetooth Speaker — Outdoor", description: "Rugged wireless speaker with 360° sound and 12-hour playtime. IPX7 waterproof rating. Built-in microphone for hands-free calls." },
  { name: "USB-C Hub — 7-in-1", description: "Expand your laptop with HDMI, USB 3.0, SD card reader, and 100W pass-through charging. Aluminum body, plug-and-play — no drivers required." },
  { name: "Smart LED Desk Lamp", description: "Adjustable arm lamp with five brightness levels and three color temperatures. Touch controls, memory function, and energy-efficient LED panel." },
  { name: "Mechanical Keyboard — Compact", description: "75% layout mechanical keyboard with hot-swappable switches and RGB backlight. PBT keycaps, USB-C connection. Ideal for work and gaming." },
  { name: "4K Action Camera", description: "Capture adventures in 4K at 30fps with electronic image stabilization. Waterproof case included. Wi-Fi transfer to smartphone app." },
  // Fashion & Apparel (16–20)
  { name: "Merino Wool Sweater — Navy", description: "Fine merino wool pullover that's naturally temperature-regulating and odor-resistant. Ribbed cuffs and hem. Machine wash cold on gentle cycle." },
  { name: "Classic Chino Pants — Khaki", description: "Tailored chinos in stretch cotton twill. Mid-rise fit with slant pockets and welt back pockets. Versatile for office or weekend." },
  { name: "Canvas Low-Top Sneakers", description: "Timeless canvas sneakers with cushioned insole and vulcanized rubber sole. Lace-up closure. Pairs with jeans, shorts, or casual dresses." },
  { name: "Polarized Sunglasses — Aviator", description: "UV400 polarized lenses reduce glare and protect eyes. Lightweight metal frame with adjustable nose pads. Includes hard case and cleaning cloth." },
  { name: "Wool Blend Scarf — Charcoal", description: "Soft wool-acrylic blend scarf for cold weather. Generous length for multiple wrap styles. Fringed edges. Dry clean recommended." },
  // Home & Living (21–25)
  { name: "Ceramic Dinnerware Set — 16pc", description: "Service for four including dinner plates, salad plates, bowls, and mugs. Microwave and dishwasher safe. Modern matte glaze finish." },
  { name: "Memory Foam Pillow", description: "Contoured memory foam pillow supports neck alignment for side and back sleepers. Removable, washable bamboo-derived cover. CertiPUR-US certified foam." },
  { name: "Scented Candle — Lavender", description: "Hand-poured soy wax candle with cotton wick. Approximately 45-hour burn time. Natural lavender essential oil blend. Reusable glass jar." },
  { name: "Throw Blanket — Knit", description: "Chunky knit throw blanket in soft acrylic yarn. 50×60 inches — perfect for sofas and beds. Machine washable. Adds warmth and texture to any room." },
  { name: "Stainless Steel Cookware Set", description: "Three-piece set: 8-inch fry pan, 2-quart saucepan with lid, and 6-quart stockpot with lid. Tri-ply construction for even heating. Oven safe to 500°F." },
  // Beauty & Personal Care (26–30)
  { name: "Vitamin C Serum — 1oz", description: "Brightening serum with 15% L-ascorbic acid and ferulic acid. Apply morning before moisturizer and SPF. Visible results in 4–6 weeks with consistent use." },
  { name: "Electric Toothbrush Kit", description: "Sonic toothbrush with two-minute timer and three cleaning modes. Includes charging base and two replacement heads. ADA accepted." },
  { name: "Hair Styling Clay — Matte", description: "Medium-hold matte clay for textured, natural-looking styles. Water-based formula washes out easily. Works on short to medium hair lengths." },
  { name: "Body Wash — Eucalyptus", description: "Plant-derived body wash with eucalyptus and mint. Sulfate-free, gentle on skin. Large 16oz bottle with pump dispenser." },
  { name: "Grooming Kit — Travel", description: "TSA-friendly grooming set: nail clipper, tweezers, scissors, and comb in a zippered leather case. Essential tools for travel or daily use." },
  // Sports & Outdoors (31–35)
  { name: "Yoga Mat — 6mm Extra Thick", description: "Non-slip TPE yoga mat with carrying strap. 6mm cushioning protects joints during floor work. Free of latex, PVC, and phthalates." },
  { name: "Resistance Bands Set", description: "Five color-coded bands from light to heavy resistance. Includes door anchor, handles, and ankle straps. Full-body workout guide included." },
  { name: "Camping Headlamp — Rechargeable", description: "LED headlamp with 300-lumen max output and red night-vision mode. USB rechargeable, 40-hour runtime on low. IPX4 splash resistant." },
  { name: "Stainless Steel Flask — 8oz", description: "Vacuum-insulated flask keeps beverages hot or cold for hours. Leak-proof cap, slim profile fits pockets and bags. Food-grade 18/8 steel." },
  { name: "Fitness Tracker Band", description: "Tracks steps, heart rate, sleep, and workouts. 7-day battery life. Syncs with iOS and Android. Water resistant for swimming and showers." },
  // Accessories (36–40)
  { name: "Leather Wallet — Bifold", description: "Genuine leather bifold with six card slots and bill compartment. RFID-blocking lining protects against digital theft. Slim profile fits front pocket." },
  { name: "Travel Duffel Bag — 40L", description: "Durable canvas duffel with reinforced handles and removable shoulder strap. Interior zip pocket. Fits overhead bin requirements on most airlines." },
  { name: "Silk Tie — Navy Paisley", description: "100% silk tie with classic paisley pattern. 3.25-inch blade width. Hand-finished edges. Perfect for business and formal occasions." },
  { name: "Key Organizer — Leather", description: "Hold up to six keys in a compact leather holder. Eliminates pocket bulk and key jingle. Expandable post accommodates most key types." },
  { name: "Laptop Sleeve — 15 inch", description: "Padded neoprene sleeve protects laptops up to 15.6 inches. Slim design slides into backpacks and briefcases. Zippered front pocket for cables." },
  // Clearance & Special Offers (41–50)
  { name: "Bundle — Skincare Starter Kit", description: "Three-step skincare set: cleanser, toner, and moisturizer. Suitable for normal to combination skin. Save 20% compared to buying separately." },
  { name: "Bundle — Home Office Essentials", description: "Desk organizer, mouse pad, and cable management kit. Everything needed to set up a clean, productive workspace at home." },
  { name: "Open-Box — Smart Speaker", description: "Previous-generation smart speaker in open-box condition. Fully tested and functional. Voice assistant compatible. Minor packaging wear only." },
  { name: "Seasonal — Gift Set Box", description: "Curated gift box with three customer-favorite items. Ready to wrap and give. Limited seasonal availability." },
  { name: "Refurbished — Tablet 10 inch", description: "Certified refurbished tablet with 10-inch display, 64GB storage, and one-year warranty. Inspected and restored to factory standards." },
  { name: "Limited Edition — Cap Collection", description: "Exclusive cap design not available in standard catalog. Embroidered logo, adjustable strap. Once sold out, will not be restocked." },
  { name: "Outlet — Classic Polo Shirt", description: "End-of-season polo in pique cotton. Side vents and ribbed collar. Final sale pricing while supplies last." },
  { name: "Outlet — Canvas Tote Bag", description: "Heavy-duty canvas tote with interior pocket and reinforced handles. Ideal for groceries, gym, or daily errands. While supplies last." },
  { name: "Flash Deal — Earbud Case Cover", description: "Protective silicone case for popular earbud models. Anti-scratch, easy grip. Available in multiple colors while flash deal lasts." },
  { name: "Flash Deal — Phone Grip Stand", description: "Adhesive phone grip that doubles as a stand for video calls and media. Universal fit. Limited-time pricing." },
];

function defaultSections(): Section[] {
  return SECTION_NAMES.map((name, i) => ({
    id: i + 1,
    name,
    sort_order: i + 1,
  }));
}

function sectionForProductIndex(index: number): number {
  if (index >= 40) return 9;
  return Math.floor(index / 5) + 1;
}

function defaultStore(): Store {
  const placeholders = [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560343090-f0409e92703a?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1546868871-7041f69a55b0?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1585386959984-a41552231654?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop",
  ];

  const sections = defaultSections();
  const products: Product[] = [];

  for (let i = 1; i <= 50; i++) {
    const id = i;
    const catalog = PRODUCT_CATALOG[i - 1];
    const name = catalog?.name ?? `Catalog Item ${i}`;
    const description =
      catalog?.description ??
      "This product is available in our online catalog. Update the name, description, image, and price from your admin dashboard.";
    products.push({
      id,
      name,
      slug: slugify(name, id),
      description,
      price: 1000,
      image_url: placeholders[(i - 1) % placeholders.length],
      section_id: sectionForProductIndex(i - 1),
      created_at: new Date().toISOString(),
    });
  }

  return {
    products,
    sections,
    settings: defaultSettings(),
    orders: [],
    order_items: [],
    admin: {
      username: "admin",
      password_hash: bcrypt.hashSync("admin123", 10),
    },
    nextProductId: 51,
    nextOrderId: 1,
    nextOrderItemId: 1,
  };
}

function migrateStore(raw: Partial<Store> & { products: Product[] }): Store {
  const sections = raw.sections?.length
    ? raw.sections.map((s, i) => {
        const isOldDefault =
          /^Section \d+$/.test(s.name) || s.name === "Featured Collection";
        return isOldDefault && SECTION_NAMES[i]
          ? { ...s, name: SECTION_NAMES[i] }
          : s;
      })
    : defaultSections();

  const settings = { ...defaultSettings(), ...(raw.settings ?? {}) };

  const products = raw.products.map((p, index) => {
    const section_id = p.section_id ?? sectionForProductIndex(index);
    const isOldPlaceholder =
      /^Product \d+$/.test(p.name) ||
      p.description.includes("Premium quality item") ||
      p.description.includes("Edit this name, description, and image");
    if (isOldPlaceholder && PRODUCT_CATALOG[index]) {
      const catalog = PRODUCT_CATALOG[index];
      return {
        ...p,
        name: catalog.name,
        slug: slugify(catalog.name, p.id),
        description: catalog.description,
        section_id,
      };
    }
    return { ...p, section_id };
  });

  return {
    products,
    sections,
    settings,
    orders: (raw.orders ?? []).map((o) => ({
      ...o,
      payment_method: o.payment_method ?? "standard",
    })),
    order_items: raw.order_items ?? [],
    admin: raw.admin ?? {
      username: "admin",
      password_hash: bcrypt.hashSync("admin123", 10),
    },
    nextProductId: raw.nextProductId ?? 51,
    nextOrderId: raw.nextOrderId ?? 1,
    nextOrderItemId: raw.nextOrderItemId ?? 1,
  };
}

function readStore(): Store {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const store = defaultStore();
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2));
    return store;
  }

  const raw = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) as Partial<Store> & { products: Product[] };
  const store = migrateStore(raw);

  const needsSave =
    !raw.sections ||
    !raw.settings ||
    raw.products.some((p) => p.section_id == null) ||
    !raw.settings?.hero_title ||
    raw.settings?.btc_wallet_address === undefined ||
    raw.products.some(
      (p) =>
        /^Product \d+$/.test(p.name) ||
        p.description.includes("Premium quality item")
    ) ||
    (raw.sections?.some(
      (s, i) =>
        (/^Section \d+$/.test(s.name) || s.name === "Featured Collection") &&
        SECTION_NAMES[i]
    ) ?? false);

  if (needsSave) {
    writeStore(store);
  }

  seedReviewsIfNeeded(store.products.map((p) => p.id));

  return store;
}

function writeStore(store: Store): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2));
}

export function getSiteSettings(): SiteSettings {
  return readStore().settings;
}

export function updateSiteSettings(data: Partial<SiteSettings>): SiteSettings {
  const store = readStore();
  store.settings = { ...store.settings, ...data };
  writeStore(store);
  return store.settings;
}

export function getAllSections(): Section[] {
  return [...readStore().sections].sort((a, b) => a.sort_order - b.sort_order);
}

export function getSectionById(id: number): Section | undefined {
  return readStore().sections.find((s) => s.id === id);
}

export function updateSection(id: number, data: { name: string }): Section | undefined {
  const store = readStore();
  const index = store.sections.findIndex((s) => s.id === id);
  if (index === -1) return undefined;

  store.sections[index] = { ...store.sections[index], name: data.name };
  writeStore(store);
  return store.sections[index];
}

export function getProductsBySection(): SectionWithProducts[] {
  const store = readStore();
  const sections = [...store.sections].sort((a, b) => a.sort_order - b.sort_order);

  return sections.map((section) => ({
    ...section,
    products: store.products
      .filter((p) => p.section_id === section.id)
      .sort((a, b) => a.id - b.id),
  }));
}

export function getAllProducts(): Product[] {
  const store = readStore();
  return [...store.products].sort((a, b) => a.id - b.id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return readStore().products.find((p) => p.slug === slug);
}

export function getProductById(id: number): Product | undefined {
  return readStore().products.find((p) => p.id === id);
}

export function updateProduct(
  id: number,
  data: {
    name: string;
    description: string;
    image_url: string;
    price?: number;
    section_id?: number;
  }
): Product | undefined {
  const store = readStore();
  const index = store.products.findIndex((p) => p.id === id);
  if (index === -1) return undefined;

  const existing = store.products[index];
  const updated: Product = {
    ...existing,
    name: data.name,
    slug: slugify(data.name, id),
    description: data.description,
    image_url: data.image_url,
    price: data.price ?? existing.price,
    section_id: data.section_id ?? existing.section_id,
  };
  store.products[index] = updated;
  writeStore(store);
  return updated;
}

export function verifyAdmin(username: string, password: string): boolean {
  const store = readStore();
  if (store.admin.username !== username) return false;
  return bcrypt.compareSync(password, store.admin.password_hash);
}

export function createOrder(
  customer: {
    name: string;
    email: string;
    address: string;
    city: string;
    zip: string;
  },
  items: { product_id: number; product_name: string; quantity: number; price: number }[],
  paymentMethod = "standard"
): { order: Order; items: OrderItem[] } {
  const store = readStore();
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

  const order: Order = {
    id: store.nextOrderId,
    order_number: orderNumber,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_address: customer.address,
    customer_city: customer.city,
    customer_zip: customer.zip,
    total,
    status: "confirmed",
    payment_method: paymentMethod,
    created_at: new Date().toISOString(),
  };

  const orderItems: OrderItem[] = items.map((item) => ({
    id: store.nextOrderItemId++,
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    price: item.price,
  }));

  store.orders.push(order);
  store.order_items.push(...orderItems);
  store.nextOrderId++;
  writeStore(store);

  return { order, items: orderItems };
}

export function getOrderByNumber(orderNumber: string): { order: Order; items: OrderItem[] } | null {
  const store = readStore();
  const order = store.orders.find((o) => o.order_number === orderNumber);
  if (!order) return null;
  const items = store.order_items.filter((i) => i.order_id === order.id);
  return { order, items };
}

export function getAllOrders(): Order[] {
  const store = readStore();
  return [...store.orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
