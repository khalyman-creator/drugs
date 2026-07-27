import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/db/supabase-settings";
import { PolicyContent } from "@/components/PolicyContent";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "About Us",
  description: "Learn more about who we are.",
  alternates: { canonical: `${getSiteUrl()}/about` },
};

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl uppercase tracking-tight text-brand-600 sm:text-4xl">
        {settings.about_title}
      </h1>
      <span className="accent-bar" />
      <PolicyContent text={settings.about_text} />
    </div>
  );
}
