import Link from "next/link";
import { ProductCard } from "./ProductCard";
import type { Product, ProductPricingOption } from "@/lib/types";
import { CONTAINER, SECTION_PADDING } from "@/lib/design-tokens";

export function ProductCarousel({
  title,
  subtitle,
  products,
  pricingOptionsByProduct,
  seeAllHref,
  tone = "light",
}: {
  title: string;
  subtitle?: string;
  products: Product[];
  pricingOptionsByProduct: Map<number, ProductPricingOption[]>;
  seeAllHref?: string;
  tone?: "light" | "dark";
}) {
  if (products.length === 0) return null;

  return (
    <section className={`${SECTION_PADDING} ${tone === "dark" ? "bg-gray-900" : "bg-white"}`}>
      <div className={CONTAINER}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className={`section-heading ${tone === "dark" ? "text-white" : ""}`}>{title}</h2>
            <span className="accent-bar" />
            {subtitle && (
              <p className={`section-sub ${tone === "dark" ? "text-gray-400" : ""}`}>{subtitle}</p>
            )}
          </div>
          {seeAllHref && (
            <Link
              href={seeAllHref}
              className={`focus-ring shrink-0 rounded text-sm font-bold uppercase tracking-wide ${
                tone === "dark" ? "text-white hover:text-brand-400" : "text-gray-900 hover:text-brand-600"
              }`}
            >
              See All →
            </Link>
          )}
        </div>

        <div className="scrollbar-hide mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
          {products.map((product) => (
            <div key={product.id} className="w-[45vw] shrink-0 snap-start sm:w-56 lg:w-64">
              <ProductCard
                product={product}
                pricingOptions={pricingOptionsByProduct.get(product.id) ?? []}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
