import "./globals.css";
import type { Metadata } from "next";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSiteSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSiteSettings();
  return {
    title: settings.store_name,
    description: settings.tagline,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = getSiteSettings();

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <CartProvider>
          <Header storeName={settings.store_name} tagline={settings.tagline} />
          <main>{children}</main>
          <Footer settings={settings} />
        </CartProvider>
      </body>
    </html>
  );
}
