import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSiteSettings } from "@/lib/db/supabase-settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <CartProvider>
      <Header storeName={settings.store_name} tagline={settings.tagline} />
      <main>{children}</main>
      <Footer settings={settings} />
    </CartProvider>
  );
}
