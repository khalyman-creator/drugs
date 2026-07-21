import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSiteSettings } from "@/lib/db";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = getSiteSettings();

  return (
    <CartProvider>
      <Header storeName={settings.store_name} tagline={settings.tagline} />
      <main>{children}</main>
      <Footer settings={settings} />
    </CartProvider>
  );
}
