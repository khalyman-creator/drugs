"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type SortOption =
  | "recommended"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "best-selling";

export type CatalogFilters = {
  category: number | null;
  sort: SortOption;
  minPrice: number | null;
  maxPrice: number | null;
  tiers: string[];
  onSale: boolean;
  q: string;
};

const VALID_SORTS: SortOption[] = [
  "recommended",
  "newest",
  "price-asc",
  "price-desc",
  "name-asc",
  "best-selling",
];

/** Single source of truth for catalog filter/sort/search state, synced to the URL. */
export function useCatalogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: CatalogFilters = useMemo(() => {
    const category = searchParams.get("category");
    const sortRaw = searchParams.get("sort");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    return {
      category: category ? Number(category) : null,
      sort: VALID_SORTS.includes(sortRaw as SortOption) ? (sortRaw as SortOption) : "recommended",
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      tiers: searchParams.getAll("tier"),
      onSale: searchParams.get("onSale") === "1",
      q: searchParams.get("q") ?? "",
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<CatalogFilters>) => {
      const merged = { ...filters, ...patch };
      const params = new URLSearchParams();

      if (merged.category != null) params.set("category", String(merged.category));
      if (merged.sort !== "recommended") params.set("sort", merged.sort);
      if (merged.minPrice != null) params.set("minPrice", String(merged.minPrice));
      if (merged.maxPrice != null) params.set("maxPrice", String(merged.maxPrice));
      for (const t of merged.tiers) params.append("tier", t);
      if (merged.onSale) params.set("onSale", "1");
      if (merged.q) params.set("q", merged.q);

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [filters, pathname, router]
  );

  const clearAll = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const activeFilterCount =
    (filters.category != null ? 1 : 0) +
    (filters.minPrice != null || filters.maxPrice != null ? 1 : 0) +
    filters.tiers.length +
    (filters.onSale ? 1 : 0);

  return { filters, setFilters, clearAll, activeFilterCount };
}
