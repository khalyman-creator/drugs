import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/db/supabase-settings";
import {
  getProductsBySection,
  getFeaturedProducts,
  getNewArrivalProducts,
  getBestSellingProducts,
} from "@/lib/db/supabase-products";
import { getPricingOptionsForProducts } from "@/lib/db/supabase-pricing-options";
import { getApprovedReviews } from "@/lib/db/supabase-reviews";
import { Hero } from "@/components/Hero";
import { ProductCarousel } from "@/components/ProductCarousel";
import { AboutSection } from "@/components/AboutSection";
import { Testimonials } from "@/components/Testimonials";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: { canonical: getSiteUrl() } };
}

export default async function HomePage() {
  const settings = await getSiteSettings();
  const sections = await getProductsBySection();
  const allProducts = sections.flatMap((s) => s.products);
  const pricingOptionsByProduct = await getPricingOptionsForProducts(allProducts.map((p) => p.id));

  const [newArrivals, featured, bestSellers, reviews] = await Promise.all([
    getNewArrivalProducts(8),
    getFeaturedProducts(8),
    getBestSellingProducts(8),
    getApprovedReviews(),
  ]);

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
      <ProductCarousel
        title="New Arrivals"
        subtitle="Fresh drops, straight to the front."
        products={newArrivals}
        pricingOptionsByProduct={pricingOptionsByProduct}
        seeAllHref="/products?sort=newest"
      />
      {featured.length > 0 && (
        <ProductCarousel
          title={settings.featured_products_title}
          subtitle={settings.featured_products_subtitle}
          products={featured}
          pricingOptionsByProduct={pricingOptionsByProduct}
          seeAllHref="/products"
          tone="dark"
        />
      )}
      {bestSellers.length > 0 && (
        <ProductCarousel
          title="Best Sellers"
          subtitle="What everyone's actually buying."
          products={bestSellers}
          pricingOptionsByProduct={pricingOptionsByProduct}
          seeAllHref="/products?sort=best-selling"
        />
      )}
      <AboutSection settings={settings} />
      <Testimonials settings={settings} reviews={reviews} />
    </>
  );
}
