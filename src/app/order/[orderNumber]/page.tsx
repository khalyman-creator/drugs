import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByNumber } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const result = getOrderByNumber(orderNumber);
  if (!result) notFound();

  const { order, items } = result;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-3xl text-white">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-green-900">Order Confirmed!</h1>
        <p className="mt-2 text-green-700">Thank you, {order.customer_name}</p>
        <p className="mt-1 font-mono text-sm text-green-600">{order.order_number}</p>
      </div>

      <div className="mt-8 space-y-6 rounded-2xl border border-gray-200 bg-white p-6">
        <div>
          <h2 className="font-semibold text-gray-900">Items</h2>
          <ul className="mt-3 space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.product_name} × {item.quantity}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t pt-4 font-bold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">Shipping to</h2>
          <p className="mt-2 text-sm text-gray-600">
            {order.customer_name}
            <br />
            {order.customer_address}
            <br />
            {order.customer_city}, {order.customer_zip}
            <br />
            {order.customer_email}
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">Status</h2>
          <p className="mt-1 capitalize text-brand-700">{order.status}</p>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/products"
          className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
