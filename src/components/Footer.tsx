import Image from "next/image";
import Link from "next/link";
import type { SiteSettings } from "@/lib/types";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
        <Image src="/logo.svg" alt={settings.store_name} width={165} height={68} className="mx-auto h-14 w-auto" />
        <p className="mt-1 text-sm text-gray-500">{settings.tagline}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
          <Link href="/products" className="hover:text-brand-700">Shop</Link>
          <Link href="/cart" className="hover:text-brand-700">Cart</Link>
          <Link href="/contact" className="hover:text-brand-700">Contact</Link>
          <Link href="/shipping" className="hover:text-brand-700">Shipping</Link>
          <Link href="/refunds" className="hover:text-brand-700">Refunds</Link>
          <Link href="/privacy" className="hover:text-brand-700">Privacy</Link>
          <Link href="/terms" className="hover:text-brand-700">Terms</Link>
        </div>
        <p className="mt-6 text-xs text-gray-400">{settings.footer_text}</p>
      </div>
    </footer>
  );
}
