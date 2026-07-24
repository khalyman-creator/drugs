import Link from "next/link";
import { CartButton } from "./CartButton";
import { HeaderSearch } from "./HeaderSearch";

export function Header({ storeName }: { storeName: string; tagline: string }) {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-gray-900 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="font-display shrink-0 text-xl uppercase tracking-tight text-gray-900">
          {storeName}
        </Link>
        <div className="hidden min-w-0 flex-1 sm:block">
          <HeaderSearch />
        </div>
        <nav className="flex shrink-0 items-center gap-4 sm:gap-5">
          <Link href="/products" className="text-sm font-bold uppercase tracking-wide text-gray-700 hover:text-brand-600">
            Shop
          </Link>
          <Link href="/contact" className="hidden text-sm font-bold uppercase tracking-wide text-gray-700 hover:text-brand-600 sm:inline">
            Contact
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
