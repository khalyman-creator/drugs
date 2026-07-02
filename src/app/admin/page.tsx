import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/auth";
import { getAllProducts, getAllOrders, getAllSections, getSiteSettings } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { AdminDashboard } from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }

  const products = getAllProducts();
  const orders = getAllOrders();
  const sections = getAllSections();
  const settings = getSiteSettings();

  return (
    <AdminDashboard
      products={products}
      sections={sections}
      settings={settings}
      orders={orders.map((o) => ({
        ...o,
        totalFormatted: formatPrice(o.total),
      }))}
    />
  );
}
