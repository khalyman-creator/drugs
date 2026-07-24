import Link from "next/link";
import { ProductCard } from "./ProductCard";
import type { Product, ProductPricingOption } from "@/lib/types";

export function FeaturedProducts({
  products,
  title,
  subtitle,
  pricingOptionsByProduct,
}: {
  products: Product[];
  title: string;
  subtitle: string;
  pricingOptionsByProduct: Map<number, ProductPricingOption[]>;
}) {
  const featured = products.slice(0, 8);

  return (
    <section className="bg-gray-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="section-heading">{title}</h2>
        <span className="accent-bar" />
        <p className="section-sub">{subtitle}</p>
        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              pricingOptions={pricingOptionsByProduct.get(product.id) ?? []}
            />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/products" className="btn-primary">
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}
