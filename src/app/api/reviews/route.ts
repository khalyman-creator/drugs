import { NextRequest, NextResponse } from "next/server";
import { getReviewsByProduct, addReview, getReviewSummary } from "@/lib/reviews";

export async function GET(req: NextRequest) {
  const productId = Number(req.nextUrl.searchParams.get("product_id"));
  if (!productId) {
    return NextResponse.json({ error: "product_id required" }, { status: 400 });
  }

  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 50);
  const reviews = getReviewsByProduct(productId, limit);
  const summary = getReviewSummary(productId);

  return NextResponse.json({ reviews, summary });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.product_id || !body.author_name || !body.text || !body.rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const review = addReview({
      product_id: Number(body.product_id),
      author_name: body.author_name,
      rating: Number(body.rating),
      text: body.text,
    });

    return NextResponse.json(review);
  } catch {
    return NextResponse.json({ error: "Failed to add review" }, { status: 500 });
  }
}
