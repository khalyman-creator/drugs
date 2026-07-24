import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/db/supabase-settings";
import { PolicyContent } from "@/components/PolicyContent";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the terms of service that apply when you use this site or place an order.",
  alternates: { canonical: `${getSiteUrl()}/terms` },
};

export default async function TermsOfServicePage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl uppercase tracking-tight text-gray-900 sm:text-4xl">
        Terms of Service
      </h1>
      <span className="accent-bar" />
      <PolicyContent text={settings.terms_of_service_text} />
    </div>
  );
}
