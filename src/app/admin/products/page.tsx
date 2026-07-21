import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/auth";
import { getAllProducts, getAllSections } from "@/lib/db";
import { ProductList } from "./ProductList";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }

  const products = getAllProducts();
  const sections = getAllSections();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <ProductList products={products} sections={sections} />
    </div>
  );
}
