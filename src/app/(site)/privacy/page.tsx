import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/db/supabase-settings";
import { PolicyContent } from "@/components/PolicyContent";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read our privacy policy, including what information we collect and how we use it.",
  alternates: { canonical: `${getSiteUrl()}/privacy` },
};

export default async function PrivacyPolicyPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl uppercase tracking-tight text-gray-900 sm:text-4xl">
        Privacy Policy
      </h1>
      <span className="accent-bar" />
      <PolicyContent text={settings.privacy_policy_text} />
    </div>
  );
}
