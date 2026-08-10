import Image from "next/image";
import Link from "next/link";
import type { Section, SiteSettings } from "@/lib/types";

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="focus-ring rounded text-sm text-gray-600 hover:text-brand-700">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer({ settings, sections }: { settings: SiteSettings; sections: Section[] }) {
  const activeSections = sections.filter((s) => s.is_active);

  return (
    <footer className="mt-16 border-t-2 border-gray-900 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Image src="/logo.svg" alt={settings.store_name} width={165} height={68} className="h-12 w-auto" />
            <p className="mt-3 max-w-[22ch] text-sm text-gray-500">{settings.tagline}</p>
          </div>

          <FooterColumn
            title="Shop"
            links={[
              { href: "/products", label: "All Products" },
              ...activeSections.slice(0, 5).map((s) => ({
                href: `/products?category=${s.id}`,
                label: s.name,
              })),
            ]}
          />

          <FooterColumn
            title="Customer Care"
            links={[
              { href: "/track-order", label: "Track Order" },
              { href: "/contact", label: "Contact" },
              { href: "/shipping", label: "Shipping" },
              { href: "/refunds", label: "Refunds" },
            ]}
          />

          <FooterColumn
            title="Company"
            links={[
              { href: "/about", label: "About" },
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
            ]}
          />
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6">
          <p className="text-xs text-gray-400">{settings.footer_text}</p>
        </div>
      </div>
    </footer>
  );
}
