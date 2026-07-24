import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/db/supabase-settings";
import { PolicyContent } from "@/components/PolicyContent";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Read our refund policy, including eligibility and how to request a refund.",
  alternates: { canonical: `${getSiteUrl()}/refunds` },
};

export default async function RefundPolicyPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl uppercase tracking-tight text-gray-900 sm:text-4xl">
        Refund Policy
      </h1>
      <span className="accent-bar" />
      <PolicyContent text={settings.refund_policy_text} />
    </div>
  );
}
