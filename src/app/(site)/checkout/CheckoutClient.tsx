"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";

const MIN_CHECKOUT = 20;
const SHIPPING_OPTIONS = {
  standard: { label: "Standard Shipping", price: 10 },
  express: { label: "Express Shipping", price: 20 },
} as const;
type ShippingMethod = keyof typeof SHIPPING_OPTIONS;

export default function CheckoutClient() {
  const { cart, clearCart, hydrated } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkoutReady, setCheckoutReady] = useState<boolean | null>(null);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    zip: "",
  });

  useEffect(() => {
    fetch("/api/public/store-config")
      .then((r) => r.json())
      .then((data) => {
        setCheckoutReady(Boolean(data.checkoutReady));
        if (!data.checkoutReady) {
          const missing = [];
          if (!data.supabaseConfigured) missing.push("Supabase");
          if (!data.nowpaymentsConfigured) missing.push("NOWPayments");
          if (missing.length) {
            setError(`Payment setup incomplete (${missing.join(" + ")}). Restart the server with START.bat.`);
          }
        }
      })
      .catch(() => {
        setCheckoutReady(false);
        setError("Could not verify payment configuration.");
      });
  }, []);

  useEffect(() => {
    if (searchParams.get("payment") === "failed") {
      setError("Payment was cancelled or failed. You can try again.");
    }
  }, [searchParams]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-gray-500">
        Loading...
      </div>
    );
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

  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingCost = SHIPPING_OPTIONS[shippingMethod].price;
  const total = subtotal + shippingCost;
  const belowMinimum = subtotal < MIN_CHECKOUT;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (belowMinimum) {
      setError(`Minimum order amount is ${formatPrice(MIN_CHECKOUT)}`);
      return;
    }

    if (checkoutReady === false) {
      setError("Checkout is not configured yet. Please try again later.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          shipping: shippingCost,
          items: cart.items.map((i) => ({
            productId: i.product_id,
            quantity: i.quantity,
            variantLabel: i.variant_label,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout failed");
        setLoading(false);
        return;
      }

      clearCart();

      const redirectUrl = data.redirectUrl ?? data.payment?.paymentUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      router.push(`/success?orderId=${encodeURIComponent(data.orderId)}`);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold">Checkout</h1>
      <p className="mb-8 text-gray-500">
        Pay securely with crypto via NOWPayments. Minimum order {formatPrice(MIN_CHECKOUT)}.
      </p>

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
            <h2 className="font-semibold">Shipping method</h2>
            <div className="mt-4 space-y-3">
              {(Object.keys(SHIPPING_OPTIONS) as ShippingMethod[]).map((method) => (
                <label
                  key={method}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border-2 px-4 py-3 transition ${
                    shippingMethod === method
                      ? "border-brand-600 bg-brand-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={method}
                      checked={shippingMethod === method}
                      onChange={() => setShippingMethod(method)}
                      className="h-4 w-4 accent-brand-600"
                    />
                    <span className="font-medium text-gray-900">{SHIPPING_OPTIONS[method].label}</span>
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(SHIPPING_OPTIONS[method].price)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold">Payment</h2>
            <p className="mt-1 text-sm text-gray-500">NOWPayments — crypto checkout</p>
            <p className="mt-3 text-sm text-gray-600">
              Click <span className="font-medium">Pay Now</span> to place your order and open the
              secure NOWPayments payment page. Bitcoin and 300+ cryptocurrencies are accepted.
            </p>
            <p className="mt-3 text-sm text-gray-600">New to crypto? Here&apos;s how to pay with a card:</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-gray-600">
              <li>
                Buy BTC (or another coin) with your debit or credit card on{" "}
                <a
                  href="https://changenow.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 underline hover:text-brand-700"
                >
                  ChangeNOW
                </a>
                .
              </li>
              <li>Click Pay Now below to get your unique NOWPayments payment address.</li>
              <li>Send your crypto to that address — you&apos;ll get your order confirmation once it arrives.</li>
            </ol>
          </div>

          {checkoutReady === null && (
            <p className="text-sm text-gray-500">Checking payment connection...</p>
          )}

          {checkoutReady === false && !error && (
            <p className="text-sm text-amber-700">
              Payment gateway is not connected. Run START.bat to restart the store with payment keys loaded.
            </p>
          )}

          {belowMinimum && (
            <p className="text-sm text-amber-700">
              Add {formatPrice(MIN_CHECKOUT - subtotal)} more to reach the minimum checkout amount.
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || belowMinimum || checkoutReady === false}
            className="btn-primary w-full disabled:opacity-60"
          >
            {loading ? "Creating invoice..." : `Pay Now · ${formatPrice(total)}`}
          </button>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-brand-600">
                <path
                  fillRule="evenodd"
                  d="M10 1a4 4 0 0 0-4 4v2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1V5a4 4 0 0 0-4-4Zm2 6V5a2 2 0 1 0-4 0v2h4Z"
                  clipRule="evenodd"
                />
              </svg>
              Secure checkout
            </span>
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-brand-600">
                <path
                  fillRule="evenodd"
                  d="M10 1.75c-2.4 1.44-4.6 2.1-7 2.1v6.65c0 4.6 2.98 7.6 7 8.75 4.02-1.15 7-4.15 7-8.75V3.85c-2.4 0-4.6-.66-7-2.1Zm3.03 6.03-3.75 4.5a.75.75 0 0 1-1.12.06l-1.75-1.75a.75.75 0 1 1 1.06-1.06l1.16 1.16 3.24-3.88a.75.75 0 1 1 1.16.97Z"
                  clipRule="evenodd"
                />
              </svg>
              Encrypted payment
            </span>
            <Link href="/refunds" className="flex items-center gap-1.5 hover:text-gray-700">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-brand-600">
                <path d="M10 2a8 8 0 1 0 8 8h-1.5a6.5 6.5 0 1 1-1.9-4.6L12 8h5V3l-1.65 1.65A7.98 7.98 0 0 0 10 2Z" />
              </svg>
              30-day refunds
            </Link>
          </div>

          <Link href="/cart" className="block text-center text-sm text-gray-500 hover:underline">
            ← Back to cart
          </Link>
        </form>

        <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
          <h2 className="font-semibold">Order summary</h2>
          <div className="mt-4 space-y-2">
            {cart.items.map((item) => (
              <div key={item.lineKey} className="flex justify-between text-sm">
                <span className="truncate pr-2">
                  {item.name} × {item.quantity}
                </span>
                <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{SHIPPING_OPTIONS[shippingMethod].label}</span>
              <span>{formatPrice(shippingCost)}</span>
            </div>
          </div>
          <div className="mt-2 flex justify-between border-t pt-4 font-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
