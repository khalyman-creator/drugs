export function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "text-lg" : "text-sm";
  return (
    <span className={`inline-flex gap-0.5 text-amber-400 ${cls}`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>{star <= Math.round(rating) ? "★" : "☆"}</span>
      ))}
    </span>
  );
}
