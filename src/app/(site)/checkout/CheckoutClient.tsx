"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";
import { formatOrderReference } from "@/lib/email/order-ref";
import type { PendingOrder } from "./types";

const MIN_CHECKOUT = 20;
const SHIPPING_OPTIONS = {
  standard: { label: "Standard Shipping", price: 10 },
  express: { label: "Express Shipping", price: 20 },
} as const;
type ShippingMethod = keyof typeof SHIPPING_OPTIONS;

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: string; label: string; className: string }> = {
    paid: { icon: "🟢", label: "Payment Confirmed", className: "bg-green-50 text-green-800 border-green-200" },
    pending: { icon: "🟡", label: "Payment Pending", className: "bg-amber-50 text-amber-800 border-amber-200" },
    failed: { icon: "🔴", label: "Payment Failed", className: "bg-red-50 text-red-800 border-red-200" },
    refunded: { icon: "⚪", label: "Payment Refunded", className: "bg-gray-50 text-gray-700 border-gray-200" },
  };
  const entry = map[status] ?? { icon: "⚪", label: "Payment Cancelled", className: "bg-gray-50 text-gray-700 border-gray-200" };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${entry.className}`}>
      <span aria-hidden>{entry.icon}</span>
      {entry.label}
    </span>
  );
}

function PaymentInstructions() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="font-semibold">Payment</h2>
      <p className="mt-2 text-sm font-medium text-gray-900">Secure Checkout via NOWPayments</p>
      <p className="mt-1 text-sm text-gray-600">
        Complete your payment securely through NOWPayments, with support for BTC, ETH, USDT, and
        300+ cryptocurrencies.
      </p>
      <p className="mt-2 text-sm text-gray-600">
        Select <span className="font-medium text-gray-900">Pay Now</span> to proceed to your
        secure NOWPayments payment page and complete your transaction.
      </p>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="text-sm font-semibold text-amber-900">Important Payment Instructions</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-amber-900">
          <li>
            After completing your payment, copy and securely save your NOWPayments Transaction ID
            for your records.
          </li>
          <li>
            Once your Transaction ID has been copied, the NOWPayments payment page will
            automatically close and redirect you back to SilkFreedom.
          </li>
          <li>
            Your return to SilkFreedom means you have returned to checkout after submitting the
            payment flow — it is not confirmation that your payment was received.
          </li>
          <li>Please retain your Transaction ID until your payment and order have been fully confirmed.</li>
        </ul>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <p className="text-sm font-semibold text-gray-900">Don&apos;t Have Cryptocurrency?</p>
        <p className="mt-1 text-sm text-gray-600">
          You can purchase cryptocurrency using a debit or credit card through a third-party
          exchange such as{" "}
          <a
            href="https://changenow.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 underline hover:text-brand-700"
          >
            ChangeNOW
          </a>
          , then use your cryptocurrency to complete your SilkFreedom payment.
        </p>

        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-gray-500">How It Works</p>
        <ol className="mt-2 space-y-3">
          {[
            {
              title: "Purchase Cryptocurrency",
              body: "Open ChangeNOW in a new tab and purchase BTC or another cryptocurrency supported by NOWPayments using your debit or credit card.",
            },
            {
              title: "Return to SilkFreedom",
              body: "Return to this checkout and select Pay Now to open your secure, unique NOWPayments payment page.",
            },
            {
              title: "Complete Payment & Save Your Transaction ID",
              body: "Complete your payment through NOWPayments and copy your Transaction ID. The payment page will then automatically close and redirect you back to SilkFreedom.",
            },
          ].map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                <p className="text-sm text-gray-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
        <p>
          <span className="font-semibold text-gray-700">Important:</span> ChangeNOW is an
          independent third-party service. SilkFreedom does not process, control, or verify
          transactions conducted through ChangeNOW.
        </p>
        <p>Your cryptocurrency payment to SilkFreedom is processed through NOWPayments.</p>
        <p>
          Need assistance?{" "}
          <Link href="/contact" className="text-brand-600 underline hover:text-brand-700">
            Contact SilkFreedom Support
          </Link>{" "}
          before submitting your payment.
        </p>
      </div>
    </div>
  );
}

function ResumeOrderPanel({
  pendingOrder,
  onDismiss,
}: {
  pendingOrder: PendingOrder;
  onDismiss: () => void;
}) {
  const [continuing, setContinuing] = useState(false);

  function handleContinue() {
    if (!pendingOrder.paymentUrl) return;
    setContinuing(true);
    window.location.href = pendingOrder.paymentUrl;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900">Payment Pending</h1>
          <PaymentStatusBadge status={pendingOrder.paymentStatus} />
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Your order has been saved. Your checkout information and items are still securely saved
          — nothing has been lost.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Order reference: <span className="font-mono">{formatOrderReference(pendingOrder.orderId)}</span>
        </p>

        <div className="mt-5 space-y-2 border-t border-gray-100 pt-4">
          {pendingOrder.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="min-w-0 truncate pr-2 text-gray-700">
                {item.name} × {item.quantity}
              </span>
              <span className="shrink-0 text-gray-900">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 font-bold text-gray-900">
          <span>Total</span>
          <span>{formatPrice(pendingOrder.total)}</span>
        </div>
      </div>

      <div className="mt-6">
        <PaymentInstructions />
      </div>

      {/* Actions come last — after the customer has seen the total and re-read the instructions. */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!pendingOrder.paymentUrl || continuing}
          className="btn-primary flex-1 disabled:opacity-60"
        >
          {continuing ? "Redirecting..." : "Continue Payment"}
        </button>
        <button type="button" onClick={onDismiss} className="btn-outline flex-1">
          Return to Checkout
        </button>
      </div>
    </div>
  );
}

export default function CheckoutClient({ pendingOrder }: { pendingOrder: PendingOrder | null }) {
  const { cart, clearCart, removeItem, hydrated } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkoutReady, setCheckoutReady] = useState<boolean | null>(null);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [resumeDismissed, setResumeDismissed] = useState(false);
  const submitInFlight = useRef(false);

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
    if (searchParams.get("payment") === "failed" && !pendingOrder) {
      setError("Payment was cancelled or failed. You can try again.");
    }
  }, [searchParams, pendingOrder]);

  if (pendingOrder && !resumeDismissed) {
    return <ResumeOrderPanel pendingOrder={pendingOrder} onDismiss={() => setResumeDismissed(true)} />;
  }

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

    // Guard with a ref, not just state — a fast double-click can fire twice
    // before React re-renders the disabled button.
    if (submitInFlight.current) return;
    submitInFlight.current = true;
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
        if (typeof data.unavailableProductId === "number") {
          const stale = cart.items.filter((i) => i.product_id === data.unavailableProductId);
          stale.forEach((i) => removeItem(i.lineKey));
          setError(
            `${data.error || "That item is no longer available"} — it's been removed from your cart. Please review and try again.`
          );
        } else {
          setError(data.error || "Checkout failed");
        }
        submitInFlight.current = false;
        setLoading(false);
        return;
      }

      // The cart is intentionally NOT cleared here — the order is created and
      // saved server-side, but payment isn't confirmed yet. If the customer
      // cancels or returns from NOWPayments without paying, their cart (and
      // this checkout) must still be here. The cart only clears once the
      // /success page confirms the order is actually paid.
      const redirectUrl = data.redirectUrl ?? data.payment?.paymentUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      clearCart();
      router.push(`/success?orderId=${encodeURIComponent(data.orderId)}`);
    } catch {
      setError("Something went wrong. Try again.");
      submitInFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold">Checkout</h1>
      <p className="mb-8 text-gray-500">Pay securely with crypto via NOWPayments.</p>

      <div className="grid gap-8 lg:grid-cols-5">
        <form id="checkout-form" onSubmit={handleSubmit} className="min-w-0 space-y-4 lg:col-span-3">
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

          <PaymentInstructions />
        </form>

        <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
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

      {/* Pay Now sits last — after the customer has read the payment
          instructions and seen the full order total, on every screen size. */}
      <div className="mx-auto mt-8 max-w-2xl space-y-4">
        {checkoutReady === null && (
          <p className="text-center text-sm text-gray-500">Checking payment connection...</p>
        )}

        {checkoutReady === false && !error && (
          <p className="text-center text-sm text-amber-700">
            Payment gateway is not connected. Run START.bat to restart the store with payment keys loaded.
          </p>
        )}

        {belowMinimum && (
          <p className="text-center text-sm text-amber-700">
            Add {formatPrice(MIN_CHECKOUT - subtotal)} more to reach the minimum checkout amount.
          </p>
        )}

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          form="checkout-form"
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
      </div>
    </div>
  );
}
