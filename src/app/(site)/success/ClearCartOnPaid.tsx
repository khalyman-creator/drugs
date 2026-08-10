"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/components/CartProvider";

/**
 * The cart is intentionally kept alive through the whole payment redirect
 * (see CheckoutClient) so a customer who cancels or returns without paying
 * doesn't lose their checkout. This is the one place it actually clears —
 * once the order is confirmed paid, not a moment before.
 */
export function ClearCartOnPaid({ isPaid }: { isPaid: boolean }) {
  const { clearCart, hydrated } = useCart();
  const cleared = useRef(false);

  useEffect(() => {
    if (isPaid && hydrated && !cleared.current) {
      cleared.current = true;
      clearCart();
    }
  }, [isPaid, hydrated, clearCart]);

  return null;
}
