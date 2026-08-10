"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { QuantitySelector } from "@/components/QuantitySelector";
import { formatPrice } from "@/lib/format";
import { getPricingMode } from "@/lib/pricing";

export default function CartPage() {
  const { cart, updateQty, removeItem, clearCart, hydrated } = useCart();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-gray-500">Loading cart...</div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="font-display text-2xl text-gray-900">Your cart is empty</p>
        <p className="mt-2 text-sm text-gray-500">Find something worth adding.</p>
        <Link href="/products" className="btn-primary mt-6 inline-block">
          Browse Products
        </Link>
      </div>
    );
  }

  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl uppercase tracking-tight text-gray-900">Cart</h1>
        {cart.items.length > 1 && (
          <button
            onClick={() => {
              if (confirm("Remove all items from your cart?")) clearCart();
            }}
            className="focus-ring rounded text-sm font-medium text-red-500 hover:underline"
          >
            Clear Cart
          </button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="min-w-0 space-y-4 lg:col-span-3">
          {cart.items.map((item) => (
            <div key={item.lineKey} className="card-surface flex gap-4 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_url || "/placeholder.svg"}
                alt={item.name}
                className="h-24 w-24 shrink-0 rounded-md object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="min-w-0">
                  <Link
                    href={`/product/${item.slug}`}
                    className="focus-ring block truncate font-semibold text-gray-900 hover:text-brand-600"
                  >
                    {item.name}
                  </Link>
                  {item.variant_label && getPricingMode(item.section_id) !== "standard" && (
                    <p className="truncate text-sm text-gray-500">{item.variant_label}</p>
                  )}
                  <p className="mt-1 text-brand-600">{formatPrice(item.price)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <QuantitySelector
                    size="sm"
                    value={item.quantity}
                    onChange={(qty) => updateQty(item.lineKey, qty)}
                  />
                  <button
                    onClick={() => removeItem(item.lineKey)}
                    className="focus-ring rounded text-sm text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="shrink-0 font-bold text-gray-900">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
          <h2 className="font-semibold">Order summary</h2>
          <div className="mt-4 space-y-2">
            {cart.items.map((item) => (
              <div key={item.lineKey} className="flex justify-between text-sm">
                <span className="min-w-0 truncate pr-2">
                  {item.name} × {item.quantity}
                </span>
                <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between border-t pt-4 font-bold">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Link href="/checkout" className="btn-primary mt-6 block w-full text-center">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
