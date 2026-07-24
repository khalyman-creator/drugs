import { notFound, redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/auth";
import { getProductById } from "@/lib/db/supabase-products";
import { getAllSections } from "@/lib/db/supabase-sections";
import { getPricingOptionsForProduct } from "@/lib/db/supabase-pricing-options";
import { ProductForm } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const product = await getProductById(Number(id));
  if (!product) notFound();

  const [sections, pricingOptions] = await Promise.all([
    getAllSections({ includeInactive: true }),
    getPricingOptionsForProduct(product.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <ProductForm mode="edit" product={product} sections={sections} pricingOptions={pricingOptions} />
    </div>
  );
}
