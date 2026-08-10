"use client";

import type { CatalogFilters } from "@/lib/catalog/useCatalogFilters";

export const PRICE_BUCKETS: { label: string; min: number | null; max: number | null }[] = [
  { label: "Under $50", min: null, max: 50 },
  { label: "$50 – $100", min: 50, max: 100 },
  { label: "$100 – $200", min: 100, max: 200 },
  { label: "$200+", min: 200, max: null },
];

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 py-4 first:pt-0 last:border-b-0">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-900">{title}</p>
      {children}
    </div>
  );
}

export function FilterFields({
  filters,
  availableTiers,
  onChange,
}: {
  filters: CatalogFilters;
  availableTiers: string[];
  onChange: (patch: Partial<CatalogFilters>) => void;
}) {
  const activeBucket = PRICE_BUCKETS.find(
    (b) => b.min === filters.minPrice && b.max === filters.maxPrice
  );

  return (
    <div>
      <FilterSection title="Deals">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={filters.onSale}
            onChange={(e) => onChange({ onSale: e.target.checked })}
            className="h-4 w-4 accent-brand-600"
          />
          On Sale
        </label>
      </FilterSection>

      <FilterSection title="Price">
        <div className="space-y-2">
          {PRICE_BUCKETS.map((bucket) => (
            <label key={bucket.label} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={activeBucket?.label === bucket.label}
                onChange={() =>
                  onChange(
                    activeBucket?.label === bucket.label
                      ? { minPrice: null, maxPrice: null }
                      : { minPrice: bucket.min, maxPrice: bucket.max }
                  )
                }
                className="h-4 w-4 accent-brand-600"
              />
              {bucket.label}
            </label>
          ))}
        </div>
      </FilterSection>

      {availableTiers.length > 0 && (
        <FilterSection title="Weight / Tier">
          <div className="space-y-2">
            {availableTiers.map((tier) => (
              <label key={tier} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={filters.tiers.includes(tier)}
                  onChange={(e) =>
                    onChange({
                      tiers: e.target.checked
                        ? [...filters.tiers, tier]
                        : filters.tiers.filter((t) => t !== tier),
                    })
                  }
                  className="h-4 w-4 accent-brand-600"
                />
                {tier}
              </label>
            ))}
          </div>
        </FilterSection>
      )}
    </div>
  );
}
