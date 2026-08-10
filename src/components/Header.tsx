import Link from "next/link";
import { CartButton } from "./CartButton";
import { HeaderSearch } from "./HeaderSearch";
import { SideMenu } from "./SideMenu";
import type { Section } from "@/lib/types";

export function Header({
  storeName,
  sections,
}: {
  storeName: string;
  tagline: string;
  sections: Section[];
}) {
  const activeSections = sections.filter((s) => s.is_active);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-gray-900 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="font-display shrink-0 text-xl uppercase tracking-tight">
          <span className="text-gray-900">Silk</span>
          <span className="text-brand-600">Freedom</span>
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
          <SideMenu sections={activeSections} />
        </nav>
      </div>
      <div className="border-t border-gray-100 px-4 pb-3 sm:hidden">
        <HeaderSearch />
      </div>
      {activeSections.length > 0 && (
        <div className="hidden border-t border-gray-100 bg-gray-50 lg:block">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-2">
            {activeSections.map((section) => (
              <Link
                key={section.id}
                href={`/products?category=${section.id}`}
                className="focus-ring rounded text-xs font-bold uppercase tracking-wide text-gray-600 hover:text-brand-600"
              >
                {section.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
