import fs from "fs";
import path from "path";
import type { Review, ReviewSummary } from "./review-types";

function findProjectRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json")) && fs.existsSync(path.join(dir, "data"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

const DATA_DIR = path.join(findProjectRoot(), "data");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");

type ReviewStore = {
  reviews: Review[];
  nextReviewId: number;
};

const FIRST_NAMES = [
  "Marcus", "Jaylen", "DeShawn", "Tyler", "Brandon", "Chris", "Jordan", "Malik",
  "Andre", "Kevin", "Darius", "Eric", "Ryan", "James", "David", "Michael",
  "Ashley", "Brittany", "Jasmine", "Taylor", "Destiny", "Aaliyah", "Kayla", "Mia",
  "Sophia", "Emily", "Olivia", "Ava", "Isabella", "Chloe", "Nina", "Rosa",
];

const LAST_INITIALS = "ABCDEFGHJKLMNPRSTUVWXYZ".split("");

const REVIEW_TEMPLATES = [
  "Exactly what I ordered. Fast shipping and solid quality. Will buy again.",
  "Verified purchase — product matched the description perfectly. No complaints.",
  "Great value for the price. Packaging was secure and delivery was quick.",
  "Five stars. This is my second order and both times were smooth.",
  "Legit product. Customer support answered my questions same day.",
  "Showed up on time, well packed. Quality exceeded my expectations.",
  "Honest review: took a few days to arrive but worth the wait. A+",
  "Clean transaction from cart to checkout. Product is fire.",
  "My go-to spot now. Verified buyer and very satisfied.",
  "Real talk — quality is top tier. Already told my people about this.",
  "Smooth checkout, no issues. Product looks exactly like the photos.",
  "Reliable every time. This order was no different — 10/10.",
  "Good experience overall. Would recommend to anyone on the fence.",
  "Solid product. Arrived faster than expected which was a nice surprise.",
  "Third purchase here. Consistent quality and fair pricing.",
  "Verified order. Everything checked out. Happy customer.",
  "No cap — this is legit. Will be back for more.",
  "Professional service. Product quality speaks for itself.",
  "Easy to order, easy checkout. Product did not disappoint.",
  "Trustworthy seller. Item was authentic and well described.",
];

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function reviewCountForProduct(productId: number): number {
  return Math.floor(pseudoRandom(productId * 17) * 150) + 1;
}

function avatarUrl(seed: number, gender: "men" | "women"): string {
  const n = Math.floor(pseudoRandom(seed) * 99);
  return `https://randomuser.me/api/portraits/${gender}/${n}.jpg`;
}

export function generateReviewsForProducts(productIds: number[]): Review[] {
  const reviews: Review[] = [];
  let id = 1;

  for (const productId of productIds) {
    const count = reviewCountForProduct(productId);
    for (let r = 0; r < count; r++) {
      const seed = productId * 1000 + r;
      const firstName = FIRST_NAMES[Math.floor(pseudoRandom(seed) * FIRST_NAMES.length)];
      const lastInitial = LAST_INITIALS[Math.floor(pseudoRandom(seed + 1) * LAST_INITIALS.length)];
      const rating = Math.min(5, Math.max(1, Math.round(pseudoRandom(seed + 2) * 5 + pseudoRandom(seed + 3) * 0.5)));
      const gender = pseudoRandom(seed + 4) > 0.5 ? "men" : "women";
      const template = REVIEW_TEMPLATES[Math.floor(pseudoRandom(seed + 5) * REVIEW_TEMPLATES.length)];
      const daysAgo = Math.floor(pseudoRandom(seed + 6) * 365);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      reviews.push({
        id: id++,
        product_id: productId,
        author_name: `${firstName} ${lastInitial}.`,
        rating,
        text: template,
        avatar_url: avatarUrl(seed + 7, gender),
        verified: pseudoRandom(seed + 8) > 0.15,
        created_at: date.toISOString(),
      });
    }
  }

  return reviews;
}

function readReviewStore(): ReviewStore {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(REVIEWS_FILE)) {
    return { reviews: [], nextReviewId: 1 };
  }

  return JSON.parse(fs.readFileSync(REVIEWS_FILE, "utf-8")) as ReviewStore;
}

function writeReviewStore(store: ReviewStore): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(store));
}

export function seedReviewsIfNeeded(productIds: number[]): void {
  const store = readReviewStore();
  if (store.reviews.length > 0) return;

  const generated = generateReviewsForProducts(productIds);
  writeReviewStore({
    reviews: generated,
    nextReviewId: generated.length + 1,
  });
}

export function getReviewsByProduct(productId: number, limit = 50, offset = 0): Review[] {
  const store = readReviewStore();
  return store.reviews
    .filter((r) => r.product_id === productId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(offset, offset + limit);
}

export function getReviewSummary(productId: number): ReviewSummary {
  const store = readReviewStore();
  const productReviews = store.reviews.filter((r) => r.product_id === productId);
  if (productReviews.length === 0) return { average: 0, count: 0 };
  const sum = productReviews.reduce((s, r) => s + r.rating, 0);
  return {
    average: Math.round((sum / productReviews.length) * 10) / 10,
    count: productReviews.length,
  };
}

export function getAllReviewSummaries(): Record<number, ReviewSummary> {
  const store = readReviewStore();
  const map: Record<number, { sum: number; count: number }> = {};

  for (const r of store.reviews) {
    if (!map[r.product_id]) map[r.product_id] = { sum: 0, count: 0 };
    map[r.product_id].sum += r.rating;
    map[r.product_id].count += 1;
  }

  const result: Record<number, ReviewSummary> = {};
  for (const [id, data] of Object.entries(map)) {
    result[Number(id)] = {
      average: Math.round((data.sum / data.count) * 10) / 10,
      count: data.count,
    };
  }
  return result;
}

export function addReview(data: {
  product_id: number;
  author_name: string;
  rating: number;
  text: string;
}): Review {
  const store = readReviewStore();
  const rating = Math.min(5, Math.max(1, Math.round(data.rating)));
  const seed = store.nextReviewId * 31;
  const gender = seed % 2 === 0 ? "men" : "women";

  const review: Review = {
    id: store.nextReviewId++,
    product_id: data.product_id,
    author_name: data.author_name.trim(),
    rating,
    text: data.text.trim(),
    avatar_url: avatarUrl(seed, gender),
    verified: false,
    created_at: new Date().toISOString(),
  };

  store.reviews.push(review);
  writeReviewStore(store);
  return review;
}

export function getTotalReviewCount(): number {
  return readReviewStore().reviews.length;
}
