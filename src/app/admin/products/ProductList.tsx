"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Product, Section } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export function ProductList({
  products: initialProducts,
  sections,
}: {
  products: Product[];
  sections: Section[];
}) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState(initialProducts);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [toggleError, setToggleError] = useState("");

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

  async function toggleActive(product: Product) {
    setTogglingId(product.id);
    setToggleError("");
    const res = await fetch(`/api/products/${product.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !product.is_active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } else {
      const data = await res.json().catch(() => ({}));
      setToggleError(data.error || `Failed to update "${product.name}"`);
    }
    setTogglingId(null);
  }

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

      {toggleError && <p className="mb-4 text-sm text-red-600">{toggleError}</p>}

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
              {section.name} ({items.length}){!section.is_active && " — Section Offline"}
            </p>
            <ul className="divide-y">
              {items.map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-4 hover:bg-gray-50">
                  <Link href={`/admin/products/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-sm text-gray-500">{formatPrice(p.price)}</p>
                    </div>
                    <span className="text-xs text-brand-600">Edit</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleActive(p)}
                    disabled={togglingId === p.id}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-60 ${
                      p.is_active
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    {togglingId === p.id ? "..." : p.is_active ? "Online" : "Offline"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
