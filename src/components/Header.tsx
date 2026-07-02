import Link from "next/link";
import { CartButton } from "./CartButton";

export function Header({ storeName }: { storeName: string; tagline: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-xl font-bold text-brand-700">
          {storeName}
        </Link>
        <nav className="flex items-center gap-5">
          <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-brand-700">
            Shop
          </Link>
          <Link href="/admin/login" className="text-sm text-gray-400 hover:text-gray-600">
            Admin
          </Link>
          <CartButton />
        </nav>
      </div>
    </header>
  );
}
