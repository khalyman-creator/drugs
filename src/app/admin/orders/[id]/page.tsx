import { notFound, redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/auth";
import { getOrderById } from "@/lib/db/supabase-orders";
import { getOrCreateShipmentForOrder } from "@/lib/db/supabase-shipments";
import { listOrderStatusEvents } from "@/lib/db/supabase-order-events";
import { findPaymentByOrderId } from "@/lib/db/supabase-payments";
import { OrderDetailClient } from "./OrderDetailClient";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const [shipment, events, payment] = await Promise.all([
    getOrCreateShipmentForOrder(id),
    listOrderStatusEvents(id),
    findPaymentByOrderId(id),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <OrderDetailClient order={order} shipment={shipment} events={events} payment={payment} />
    </div>
  );
}
