import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/db/supabase-settings";
import { getAllProducts } from "@/lib/db/supabase-products";
import { getPricingOptionsForProducts } from "@/lib/db/supabase-pricing-options";
import { getApprovedReviews } from "@/lib/db/supabase-reviews";
import { Hero } from "@/components/Hero";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { AboutSection } from "@/components/AboutSection";
import { Testimonials } from "@/components/Testimonials";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: { canonical: getSiteUrl() } };
}

export default async function HomePage() {
  const settings = await getSiteSettings();
  const products = await getAllProducts();
  const pricingOptionsByProduct = await getPricingOptionsForProducts(products.map((p) => p.id));
  const reviews = await getApprovedReviews();
  const siteUrl = getSiteUrl();

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.store_name,
    description: settings.tagline,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/products?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Hero settings={settings} />
      <FeaturedProducts
        products={products}
        title={settings.featured_products_title}
        subtitle={settings.featured_products_subtitle}
        pricingOptionsByProduct={pricingOptionsByProduct}
      />
      <AboutSection settings={settings} />
      <Testimonials settings={settings} reviews={reviews} />
    </>
  );
}
