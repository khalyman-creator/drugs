"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { cart, updateQty, removeItem, hydrated } = useCart();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-gray-500">Loading cart...</div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">Cart</h1>
      <div className="space-y-4">
        {cart.items.map((item) => (
          <div
            key={item.product_id}
            className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt={item.name}
              className="h-24 w-24 rounded-xl object-cover"
            />
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <Link href={`/product/${item.slug}`} className="font-semibold hover:text-brand-700">
                  {item.name}
                </Link>
                <p className="text-brand-700">{formatPrice(item.price)}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQty(item.product_id, item.quantity - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-gray-50"
                >
                  −
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.product_id, item.quantity + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-gray-50"
                >
                  +
                </button>
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="ml-auto text-sm text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex justify-between text-xl font-bold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
        <Link
          href="/checkout"
          className="mt-6 block w-full rounded-xl bg-brand-600 py-3 text-center font-semibold text-white hover:bg-brand-700"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
