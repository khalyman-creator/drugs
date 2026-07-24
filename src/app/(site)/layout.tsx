import Script from "next/script";
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
          s1.src='https://embed.tawk.to/6a63a95b1320a91d46342103/1juakr3it';
          s1.charset='UTF-8';
          s1.setAttribute('crossorigin','*');
          s0.parentNode.insertBefore(s1,s0);
          })();
        `}
      </Script>
    </CartProvider>
  );
}
