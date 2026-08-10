"use client";

import type { SortOption } from "@/lib/catalog/useCatalogFilters";

const SORT_LABELS: Record<SortOption, string> = {
  recommended: "Recommended",
  newest: "Newest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "name-asc": "Name: A–Z",
  "best-selling": "Best Selling",
};

export function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}) {
  return (
    <label className="flex shrink-0 items-center gap-2 text-sm">
      <span className="hidden font-medium text-gray-600 sm:inline">Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="focus-ring rounded-sm border-2 border-gray-900 bg-white px-3 py-2 text-sm font-medium"
      >
        {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
          <option key={key} value={key}>
            {SORT_LABELS[key]}
          </option>
        ))}
      </select>
    </label>
  );
}
