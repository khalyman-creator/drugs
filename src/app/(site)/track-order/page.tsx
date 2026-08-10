import type { Metadata } from "next";
import { TrackOrderClient } from "./TrackOrderClient";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Look up your order status and shipment tracking.",
  alternates: { canonical: `${getSiteUrl()}/track-order` },
};

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl uppercase tracking-tight text-gray-900 sm:text-4xl">
        Track Your Order
      </h1>
      <span className="accent-bar" />
      <p className="mt-4 text-gray-600">
        Enter your order reference to see its current status.
      </p>
      <TrackOrderClient initialRef={ref} />
    </div>
  );
}
