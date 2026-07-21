import Link from "next/link";
import { CartButton } from "./CartButton";
import { HeaderSearch } from "./HeaderSearch";

export function Header({ storeName }: { storeName: string; tagline: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0 text-xl font-bold text-brand-700">
          {storeName}
        </Link>
        <div className="hidden min-w-0 flex-1 sm:block">
          <HeaderSearch />
        </div>
        <nav className="flex shrink-0 items-center gap-4 sm:gap-5">
          <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-brand-700">
            Shop
          </Link>
          <Link href="/contact" className="hidden text-sm font-medium text-gray-600 hover:text-brand-700 sm:inline">
            Contact
          </Link>
          <Link href="/admin/login" className="hidden text-sm text-gray-400 hover:text-gray-600 md:inline">
            Admin
          </Link>
          <CartButton />
        </nav>
      </div>
      <div className="border-t border-gray-100 px-4 pb-3 sm:hidden">
        <HeaderSearch />
      </div>
    </header>
  );
}
