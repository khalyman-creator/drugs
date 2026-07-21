"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";

const MIN_CHECKOUT = 20;

export default function CheckoutClient() {
  const { cart, clearCart, hydrated } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkoutReady, setCheckoutReady] = useState<boolean | null>(null);

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

  const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const belowMinimum = total < MIN_CHECKOUT;

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
              Add {formatPrice(MIN_CHECKOUT - total)} more to reach the minimum checkout amount.
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
          <div className="mt-4 flex justify-between border-t pt-4 font-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
