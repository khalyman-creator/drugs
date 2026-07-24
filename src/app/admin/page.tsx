import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/auth";
import { getAllProducts } from "@/lib/db/supabase-products";
import { getAllSections } from "@/lib/db/supabase-sections";
import { getSiteSettings } from "@/lib/db/supabase-settings";
import { getAllOrdersForAdmin } from "@/lib/db/supabase-orders";
import { getAllReviewsForAdmin } from "@/lib/db/supabase-reviews";
import { formatPrice } from "@/lib/format";
import { AdminDashboard } from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }

  const products = await getAllProducts({ includeInactive: true });
  const orders = await getAllOrdersForAdmin();
  const sections = await getAllSections({ includeInactive: true });
  const settings = await getSiteSettings();
  const reviews = await getAllReviewsForAdmin();

  return (
    <AdminDashboard
      products={products}
      sections={sections}
      settings={settings}
      orders={orders.map((o) => ({
        ...o,
        totalFormatted: formatPrice(o.total),
      }))}
      reviews={reviews}
    />
  );
}
