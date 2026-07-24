import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/auth";
import { getAllProducts } from "@/lib/db/supabase-products";
import { getAllSections } from "@/lib/db/supabase-sections";
import { ProductList } from "./ProductList";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }

  const products = await getAllProducts({ includeInactive: true });
  const sections = await getAllSections({ includeInactive: true });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <ProductList products={products} sections={sections} />
    </div>
  );
}
