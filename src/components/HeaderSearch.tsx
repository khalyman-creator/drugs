"use client";

import { Suspense } from "react";
import { ProductSearch } from "./ProductSearch";

function SearchFallback() {
  return (
    <div className="h-9 w-full max-w-md flex-1 animate-pulse rounded-lg bg-gray-100" aria-hidden />
  );
}

export function HeaderSearch() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <ProductSearch />
    </Suspense>
  );
}
