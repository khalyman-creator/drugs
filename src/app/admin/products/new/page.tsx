import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/auth";
import { getAllSections } from "@/lib/db/supabase-sections";
import { getSiteSettings } from "@/lib/db/supabase-settings";
import { ProductForm } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }

  const { section } = await searchParams;
  const [sections, siteDefaults] = await Promise.all([
    getAllSections({ includeInactive: true }),
    getSiteSettings(),
  ]);

  const defaultSectionId = section ? Number(section) : undefined;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <ProductForm
        mode="create"
        sections={sections}
        siteDefaults={siteDefaults}
        defaultSectionId={defaultSectionId}
      />
    </div>
  );
}
