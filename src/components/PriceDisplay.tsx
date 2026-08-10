import { formatPrice } from "@/lib/format";

export function PriceDisplay({
  price,
  salePrice,
  size = "md",
}: {
  price: number;
  salePrice?: number | null;
  size?: "sm" | "md";
}) {
  const onSale = salePrice != null && salePrice < price;
  const priceClass = size === "sm" ? "text-base" : "font-display text-lg";

  if (!onSale) {
    return <p className={`${priceClass} text-brand-600`}>{formatPrice(price)}</p>;
  }

  return (
    <p className="flex flex-wrap items-baseline gap-2">
      <span className={`${priceClass} text-brand-600`}>{formatPrice(salePrice)}</span>
      <span className="text-sm text-gray-400 line-through">{formatPrice(price)}</span>
    </p>
  );
}
