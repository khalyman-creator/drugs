"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Product, Section } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export function ProductList({
  products,
  sections,
}: {
  products: Product[];
  sections: Section[];
}) {
  const [search, setSearch] = useState("");

  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sections
      .map((section) => ({
        section,
        items: products.filter(
          (p) => p.section_id === section.id && (!q || p.name.toLowerCase().includes(q))
        ),
      }))
      .filter(({ items }) => items.length > 0);
  }, [sections, products, search]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-brand-600 hover:underline">
            ← Back to Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Products ({products.length})</h1>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Add New Product
        </Link>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products..."
        className="mb-6 w-full max-w-md rounded-xl border px-4 py-2.5 text-sm"
      />

      <div className="max-w-2xl overflow-hidden rounded-2xl border bg-white">
        {filteredSections.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-400">No products match your search.</p>
        )}
        {filteredSections.map(({ section, items }) => (
          <div key={section.id}>
            <p className="bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {section.name} ({items.length})
            </p>
            <ul className="divide-y">
              {items.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-sm text-gray-500">{formatPrice(p.price)}</p>
                    </div>
                    <span className="text-xs text-brand-600">Edit</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
