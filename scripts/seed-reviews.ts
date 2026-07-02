import { getAllProducts } from "../src/lib/db";
import { generateReviewsForProducts } from "../src/lib/reviews";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");

const products = getAllProducts();
const reviews = generateReviewsForProducts(products.map((p) => p.id));

fs.writeFileSync(
  REVIEWS_FILE,
  JSON.stringify({ reviews, nextReviewId: reviews.length + 1 })
);

console.log(`Seeded ${reviews.length} reviews for ${products.length} products`);
