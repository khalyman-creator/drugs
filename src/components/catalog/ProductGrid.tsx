import { ProductCard } from "@/components/ProductCard";
import { PRODUCT_GRID } from "@/lib/design-tokens";
import type { Product, ProductPricingOption, Section } from "@/lib/types";

export function ProductGrid({
  products,
  pricingOptionsByProduct,
  sectionsById,
}: {
  products: Product[];
  pricingOptionsByProduct: Map<number, ProductPricingOption[]>;
  sectionsById?: Map<number, Section>;
}) {
  return (
    <div className={PRODUCT_GRID}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          pricingOptions={pricingOptionsByProduct.get(product.id) ?? []}
          sectionName={sectionsById?.get(product.section_id)?.name}
        />
      ))}
    </div>
  );
}
