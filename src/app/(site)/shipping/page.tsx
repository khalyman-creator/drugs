import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/db/supabase-settings";
import { PolicyContent } from "@/components/PolicyContent";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Shipping Policy",
  description: "Read our shipping policy, including delivery times and shipping costs.",
  alternates: { canonical: `${getSiteUrl()}/shipping` },
};

export default async function ShippingPolicyPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl uppercase tracking-tight text-gray-900 sm:text-4xl">
        Shipping Policy
      </h1>
      <span className="accent-bar" />
      <PolicyContent text={settings.shipping_policy_text} />
    </div>
  );
}
