"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";

type CheckoutSettings = {
  btc_wallet_address: string;
  btc_payment_enabled: boolean;
};

export default function CheckoutPage() {
  const { cart, clearCart, hydrated } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<CheckoutSettings | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"standard" | "btc">("standard");

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    zip: "",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => null);
  }, []);

  if (!hydrated) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-gray-500">Loading...</div>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link href="/products" className="mt-4 inline-block btn-primary">
          Go shopping
        </Link>
      </div>
    );
  }

  const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const btcEnabled = settings?.btc_payment_enabled && settings?.btc_wallet_address;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (paymentMethod === "btc" && !btcEnabled) {
      setError("BTC payments not set up yet. Use standard checkout or add your wallet in admin.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          items: cart.items.map((i) => ({
            product_id: i.product_id,
            product_name: i.name,
            quantity: i.quantity,
            price: i.price,
          })),
          payment_method: paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout failed");
        setLoading(false);
        return;
      }

      clearCart();
      router.push(`/order/${data.order.order_number}`);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold">Checkout</h1>
      <p className="mb-8 text-gray-500">Simple and fast — fill in your info and place your order.</p>

      <div className="grid gap-8 lg:grid-cols-5">
        <form onSubmit={handleSubmit} className="space-y-4 lg:col-span-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold">Shipping</h2>
            <div className="mt-4 space-y-3">
              {(["name", "email", "address", "city", "zip"] as const).map((field) => (
                <div key={field}>
                  <label className="mb-1 block text-sm font-medium capitalize text-gray-700">
                    {field === "zip" ? "ZIP Code" : field}
                  </label>
                  <input
                    required
                    type={field === "email" ? "email" : "text"}
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold">Payment</h2>
            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "standard"}
                  onChange={() => setPaymentMethod("standard")}
                />
                <span className="text-sm font-medium">Standard Checkout</span>
              </label>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                  btcEnabled ? "border-gray-200 hover:bg-gray-50" : "border-gray-100 opacity-60"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "btc"}
                  onChange={() => setPaymentMethod("btc")}
                  disabled={!btcEnabled}
                />
                <div>
                  <span className="text-sm font-medium">Bitcoin (BTC)</span>
                  {btcEnabled ? (
                    <p className="mt-1 break-all text-xs text-gray-500">
                      Send payment to: {settings?.btc_wallet_address}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-400">
                      Add your BTC wallet in Admin → Site settings (coming soon from you)
                    </p>
                  )}
                </div>
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? "Placing order..." : `Place Order · ${formatPrice(total)}`}
          </button>
          <Link href="/cart" className="block text-center text-sm text-gray-500 hover:underline">
            ← Back to cart
          </Link>
        </form>

        <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
          <h2 className="font-semibold">Order summary</h2>
          <div className="mt-4 space-y-2">
            {cart.items.map((item) => (
              <div key={item.product_id} className="flex justify-between text-sm">
                <span className="truncate pr-2">
                  {item.name} × {item.quantity}
                </span>
                <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t pt-4 font-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
