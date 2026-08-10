"use client";

import type { CatalogFilters } from "@/lib/catalog/useCatalogFilters";
import { FilterFields } from "./FilterFields";

export function FilterSidebar({
  filters,
  availableTiers,
  activeFilterCount,
  onChange,
  onClearAll,
}: {
  filters: CatalogFilters;
  availableTiers: string[];
  activeFilterCount: number;
  onChange: (patch: Partial<CatalogFilters>) => void;
  onClearAll: () => void;
}) {
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="card-surface sticky top-24 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-display text-sm uppercase tracking-wide text-gray-900">Filters</p>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="focus-ring rounded text-xs font-semibold text-brand-600 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <FilterFields filters={filters} availableTiers={availableTiers} onChange={onChange} />
      </div>
    </aside>
  );
}
