"use client";

import { useEffect } from "react";
import type { CatalogFilters } from "@/lib/catalog/useCatalogFilters";
import { FilterFields } from "./FilterFields";

export function MobileFilterDrawer({
  open,
  onClose,
  filters,
  availableTiers,
  resultCount,
  onChange,
  onClearAll,
}: {
  open: boolean;
  onClose: () => void;
  filters: CatalogFilters;
  availableTiers: string[];
  resultCount: number;
  onChange: (patch: Partial<CatalogFilters>) => void;
  onClearAll: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t-2 border-gray-900 bg-white">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <p className="font-display text-sm uppercase tracking-wide text-gray-900">Filters</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="focus-ring text-2xl leading-none text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-2">
          <FilterFields filters={filters} availableTiers={availableTiers} onChange={onChange} />
        </div>
        <div className="sticky bottom-0 flex gap-3 border-t border-gray-100 bg-white p-4">
          <button type="button" onClick={onClearAll} className="btn-outline flex-1">
            Clear all
          </button>
          <button type="button" onClick={onClose} className="btn-primary flex-1">
            Show {resultCount} {resultCount === 1 ? "result" : "results"}
          </button>
        </div>
      </div>
    </div>
  );
}
