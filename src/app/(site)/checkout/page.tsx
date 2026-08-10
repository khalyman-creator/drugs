import { Suspense } from "react";
import { redirect } from "next/navigation";
import CheckoutClient from "./CheckoutClient";
import { getOrderById } from "@/lib/db/supabase-orders";
import { findPaymentByOrderId } from "@/lib/db/supabase-payments";
import type { PendingOrder } from "./types";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  let pendingOrder: PendingOrder | null = null;

  if (orderId) {
    const order = await getOrderById(orderId);

    if (order) {
      // Already paid — nothing to resume, send them to the real confirmation page
      // instead of showing stale pending-order UI on checkout.
      if (order.status === "paid") {
        redirect(`/success?orderId=${encodeURIComponent(orderId)}`);
      }

      const payment = await findPaymentByOrderId(orderId);

      pendingOrder = {
        orderId: order.id,
        status: order.status,
        paymentStatus: payment?.status ?? "pending",
        paymentUrl: payment?.payment_url ?? null,
        subtotal: Number(order.subtotal),
        shipping: Number(order.shipping),
        total: Number(order.total),
        customerName: order.customer?.full_name ?? "",
        customerEmail: order.customer?.email ?? "",
        shippingAddress: order.customer?.shipping_address ?? "",
        items: order.items.map((item) => ({
          name: item.name,
          price: Number(item.price),
          quantity: item.quantity,
        })),
      };
    }
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-gray-500">
          Loading checkout...
        </div>
      }
    >
      <CheckoutClient pendingOrder={pendingOrder} />
    </Suspense>
  );
}
