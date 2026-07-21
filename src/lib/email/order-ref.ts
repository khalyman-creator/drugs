export function formatOrderReference(orderId: string): string {
  return `RD-${orderId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function formatEmailDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}
