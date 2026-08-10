"use client";

import type { Section } from "@/lib/types";

export function CategoryNav({
  sections,
  activeCategory,
  onSelect,
}: {
  sections: Section[];
  activeCategory: number | null;
  onSelect: (categoryId: number | null) => void;
}) {
  return (
    <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`focus-ring shrink-0 whitespace-nowrap rounded-full border-2 px-4 py-1.5 text-sm font-medium transition ${
          activeCategory == null
            ? "border-gray-900 bg-gray-900 text-white"
            : "border-gray-300 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-700"
        }`}
      >
        All Products
      </button>
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onSelect(section.id)}
          className={`focus-ring shrink-0 whitespace-nowrap rounded-full border-2 px-4 py-1.5 text-sm font-medium transition ${
            activeCategory === section.id
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-300 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-700"
          }`}
        >
          {section.name}
        </button>
      ))}
    </div>
  );
}
