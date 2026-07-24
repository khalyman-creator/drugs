import { NextRequest, NextResponse } from "next/server";
import { getAllProducts, createProduct } from "@/lib/db/supabase-products";
import { replacePricingOptionsForProduct } from "@/lib/db/supabase-pricing-options";
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
    details: body.details ?? "",
    image_url: body.image_url,
    price: Number(body.price) || 0,
    section_id: Number(body.section_id),
    is_active: body.is_active ?? true,
    allow_custom_quantity: body.allow_custom_quantity ?? true,
  });

  if (Array.isArray(body.pricing_options)) {
    await replacePricingOptionsForProduct(
      product.id,
      body.pricing_options.map(
        (o: { label: string; price: number; is_active?: boolean; unit_quantity?: number | null }) => ({
          label: String(o.label),
          price: Number(o.price) || 0,
          unit_quantity: o.unit_quantity ?? null,
          is_active: o.is_active ?? true,
        })
      )
    );
  }

  return NextResponse.json(product, { status: 201 });
}
