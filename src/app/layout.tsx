import "./globals.css";
import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/db/supabase-settings";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: settings.store_name,
      template: `%s | ${settings.store_name}`,
    },
    description: settings.tagline,
    robots: { index: true, follow: true },
    openGraph: {
      siteName: settings.store_name,
      title: settings.store_name,
      description: settings.tagline,
      url: siteUrl,
      type: "website",
      images: settings.hero_image_url ? [{ url: settings.hero_image_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: settings.store_name,
      description: settings.tagline,
      images: settings.hero_image_url ? [settings.hero_image_url] : undefined,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
