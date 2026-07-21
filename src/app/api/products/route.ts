import { NextRequest, NextResponse } from "next/server";
import { getAllProducts, createProduct } from "@/lib/db/supabase-products";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET() {
  const products = await getAllProducts();
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.name || !body.description || !body.image_url || !body.section_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const product = await createProduct({
    name: body.name,
    description: body.description,
    image_url: body.image_url,
    price: Number(body.price) || 0,
    section_id: Number(body.section_id),
  });

  return NextResponse.json(product, { status: 201 });
}
