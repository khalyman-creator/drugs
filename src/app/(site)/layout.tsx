import Script from "next/script";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { getSiteSettings } from "@/lib/db/supabase-settings";
import { getAllSections } from "@/lib/db/supabase-sections";
import { getSiteUrl } from "@/lib/env";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, sections] = await Promise.all([getSiteSettings(), getAllSections()]);
  const siteUrl = getSiteUrl();

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.store_name,
    url: siteUrl,
    logo: `${siteUrl}/logo.svg`,
  };

  return (
    <CartProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <AnnouncementBar
        enabled={settings.announcement_enabled}
        messages={settings.announcement_messages}
      />
      <Header storeName={settings.store_name} tagline={settings.tagline} sections={sections} />
      <main>{children}</main>
      <Footer settings={settings} sections={sections} />
      <Script id="tawk-to" strategy="afterInteractive">
        {`
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          // Lift the chat bubble clear of the Buy Now / Add to Cart buttons on product pages
          Tawk_API.customStyle = {
            visibility: {
              desktop: { position: 'br', xOffset: 20, yOffset: 90 },
              mobile: { position: 'br', xOffset: 10, yOffset: 90 }
            }
          };
          (function(){
          var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
          s1.async=true;
          s1.src='https://embed.tawk.to/6a6b05c131d0d81d4b5d423a/1jup0sv14';
          s1.charset='UTF-8';
          s1.setAttribute('crossorigin','*');
          s0.parentNode.insertBefore(s1,s0);
          })();
        `}
      </Script>
    </CartProvider>
  );
}
