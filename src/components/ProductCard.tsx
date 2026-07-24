import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Product, ProductPricingOption } from "@/lib/types";
import { getDisplayFromPrice, getPricingMode } from "@/lib/pricing";

export function ProductCard({
  product,
  pricingOptions,
}: {
  product: Product;
  pricingOptions: ProductPricingOption[];
}) {
  return (
    <div className="group overflow-hidden rounded-sm border-2 border-gray-900 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(220,38,38,1)]">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
            <span className="font-display rounded-sm bg-white px-4 py-2 text-xs uppercase tracking-wide text-gray-900">
              Quick View
            </span>
          </span>
        </div>
        <div className="border-t-2 border-gray-900 p-4">
          <h3 className="font-semibold text-gray-900 group-hover:text-brand-600">{product.name}</h3>
          <p className="font-display mt-2 text-lg text-brand-600">
            {getPricingMode(product.section_id) === "standard"
              ? formatPrice(product.price)
              : formatPrice(getDisplayFromPrice(pricingOptions, product.price))}
          </p>
        </div>
      </Link>
    </div>
  );
}
