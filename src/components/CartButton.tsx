"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function CartButton() {
  const { itemCount, hydrated } = useCart();

  return (
    <Link href="/cart" className="btn-primary relative !py-2 !px-4 text-sm">
      Cart
      {hydrated && itemCount > 0 && (
        <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-brand-700">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
