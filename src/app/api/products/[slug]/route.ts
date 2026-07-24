import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug, updateProduct, deleteProduct } from "@/lib/db/supabase-products";
import { replacePricingOptionsForProduct } from "@/lib/db/supabase-pricing-options";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const product = await getProductBySlug(slug, { includeInactive: true });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await updateProduct(product.id, {
    name: body.name ?? product.name,
    description: body.description ?? product.description,
    details: body.details ?? product.details,
    image_url: body.image_url ?? product.image_url,
    price: body.price ?? product.price,
    section_id: body.section_id ?? product.section_id,
    is_active: body.is_active ?? product.is_active,
    allow_custom_quantity: body.allow_custom_quantity ?? product.allow_custom_quantity,
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

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const product = await getProductBySlug(slug, { includeInactive: true });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteProduct(product.id);
  return NextResponse.json({ ok: true });
}
