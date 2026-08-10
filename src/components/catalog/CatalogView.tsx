"use client";

import { useMemo, useState } from "react";
import type { Product, ProductPricingOption, Section } from "@/lib/types";
import { getEffectivePricing, getPricingMode, getActiveOptions } from "@/lib/pricing";
import { useCatalogFilters } from "@/lib/catalog/useCatalogFilters";
import { CategoryNav } from "./CategoryNav";
import { SortDropdown } from "./SortDropdown";
import { FilterSidebar } from "./FilterSidebar";
import { MobileFilterDrawer } from "./MobileFilterDrawer";
import { ProductGrid } from "./ProductGrid";
import { EmptyState } from "@/components/EmptyState";

export function CatalogView({
  sections,
  products,
  pricingOptionsEntries,
  bestSellingRank,
}: {
  sections: Section[];
  products: Product[];
  pricingOptionsEntries: [number, ProductPricingOption[]][];
  bestSellingRank: [number, number][];
}) {
  const { filters, setFilters, clearAll, activeFilterCount } = useCatalogFilters();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const pricingOptionsByProduct = useMemo(
    () => new Map(pricingOptionsEntries),
    [pricingOptionsEntries]
  );
  const rankByProduct = useMemo(() => new Map(bestSellingRank), [bestSellingRank]);
  const sectionsById = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    return products.filter((product) => {
      if (filters.category != null && product.section_id !== filters.category) return false;

      if (q) {
        const matches =
          product.name.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q) ||
          product.slug.toLowerCase().includes(q);
        if (!matches) return false;
      }

      const pricingOptions = pricingOptionsByProduct.get(product.id) ?? [];
      const { effectivePrice, onSale } = getEffectivePricing(product, pricingOptions);

      if (filters.onSale && !onSale) return false;
      if (filters.minPrice != null && effectivePrice < filters.minPrice) return false;
      if (filters.maxPrice != null && effectivePrice > filters.maxPrice) return false;

      if (filters.tiers.length > 0) {
        const labels = getActiveOptions(pricingOptions).map((o) => o.label);
        if (!filters.tiers.some((t) => labels.includes(t))) return false;
      }

      return true;
    });
  }, [products, filters, pricingOptionsByProduct]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (filters.sort) {
      case "newest":
        return list.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "price-asc":
        return list.sort(
          (a, b) =>
            getEffectivePricing(a, pricingOptionsByProduct.get(a.id) ?? []).effectivePrice -
            getEffectivePricing(b, pricingOptionsByProduct.get(b.id) ?? []).effectivePrice
        );
      case "price-desc":
        return list.sort(
          (a, b) =>
            getEffectivePricing(b, pricingOptionsByProduct.get(b.id) ?? []).effectivePrice -
            getEffectivePricing(a, pricingOptionsByProduct.get(a.id) ?? []).effectivePrice
        );
      case "name-asc":
        return list.sort((a, b) => a.name.trim().localeCompare(b.name.trim()));
      case "best-selling":
        return list.sort((a, b) => {
          const ra = rankByProduct.get(a.id) ?? -1;
          const rb = rankByProduct.get(b.id) ?? -1;
          return rb - ra;
        });
      case "recommended":
      default:
        return list.sort((a, b) => {
          const sa = sectionsById.get(a.section_id)?.sort_order ?? 0;
          const sb = sectionsById.get(b.section_id)?.sort_order ?? 0;
          return sa - sb || a.id - b.id;
        });
    }
  }, [filtered, filters.sort, pricingOptionsByProduct, rankByProduct, sectionsById]);

  const availableTiers = useMemo(() => {
    const labels = new Set<string>();
    for (const product of filtered) {
      if (getPricingMode(product.section_id) === "standard") continue;
      for (const option of getActiveOptions(pricingOptionsByProduct.get(product.id) ?? [])) {
        labels.add(option.label);
      }
    }
    return Array.from(labels);
  }, [filtered, pricingOptionsByProduct]);

  return (
    <div>
      {filters.q && (
        <div className="mb-4 flex items-center gap-3">
          <p className="text-sm text-gray-600">
            Search results for <span className="font-semibold text-gray-900">“{filters.q}”</span>
          </p>
          <button
            type="button"
            onClick={() => setFilters({ q: "" })}
            className="focus-ring rounded text-xs font-semibold text-brand-600 hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      <div className="mb-4">
        <CategoryNav
          sections={sections}
          activeCategory={filters.category}
          onSelect={(category) => setFilters({ category })}
        />
      </div>

      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="focus-ring flex items-center gap-1.5 rounded-sm border-2 border-gray-900 bg-white px-3 py-2 text-sm font-semibold lg:hidden"
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-gray-900 px-1.5 py-0.5 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <p className="text-sm text-gray-500">
            {sorted.length} {sorted.length === 1 ? "product" : "products"}
          </p>
        </div>
        <SortDropdown value={filters.sort} onChange={(sort) => setFilters({ sort })} />
      </div>

      <div className="flex gap-8">
        <FilterSidebar
          filters={filters}
          availableTiers={availableTiers}
          activeFilterCount={activeFilterCount}
          onChange={setFilters}
          onClearAll={clearAll}
        />

        <div className="min-w-0 flex-1">
          {sorted.length === 0 ? (
            <EmptyState
              title="No products found"
              message="Try adjusting your filters or search term."
              actionLabel="Clear Filters"
              onAction={clearAll}
            />
          ) : (
            <ProductGrid
              products={sorted}
              pricingOptionsByProduct={pricingOptionsByProduct}
              sectionsById={sectionsById}
            />
          )}
        </div>
      </div>

      <MobileFilterDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filters={filters}
        availableTiers={availableTiers}
        resultCount={sorted.length}
        onChange={setFilters}
        onClearAll={clearAll}
      />
    </div>
  );
}
