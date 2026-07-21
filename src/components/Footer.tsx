import Link from "next/link";
import type { SiteSettings } from "@/lib/types";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
        <p className="text-lg font-bold text-brand-700">{settings.store_name}</p>
        <p className="mt-1 text-sm text-gray-500">{settings.tagline}</p>
        <div className="mt-4 flex justify-center gap-6 text-sm text-gray-600">
          <Link href="/products" className="hover:text-brand-700">Shop</Link>
          <Link href="/cart" className="hover:text-brand-700">Cart</Link>
          <Link href="/contact" className="hover:text-brand-700">Contact</Link>
        </div>
        <p className="mt-6 text-xs text-gray-400">{settings.footer_text}</p>
      </div>
    </footer>
  );
}
