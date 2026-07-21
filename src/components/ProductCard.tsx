import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { getDisplayFromPrice, getPricingMode } from "@/lib/pricing";

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
            <span className="rounded bg-white px-4 py-2 text-sm font-semibold text-gray-900">
              Quick View
            </span>
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 group-hover:text-brand-700">{product.name}</h3>
          <p className="mt-2 text-lg font-bold text-brand-700">
            {getPricingMode(product.section_id) === "standard"
              ? formatPrice(product.price)
              : `From ${formatPrice(getDisplayFromPrice(product.section_id))}`}
          </p>
        </div>
      </Link>
    </div>
  );
}
