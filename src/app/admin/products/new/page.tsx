import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/auth";
import { getAllSections } from "@/lib/db/supabase-sections";
import { ProductForm } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }

  const sections = await getAllSections();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <ProductForm mode="create" sections={sections} />
    </div>
  );
}
