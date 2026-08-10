import type { Metadata } from "next";
import { Suspense } from "react";
import { getSiteSettings } from "@/lib/db/supabase-settings";
import { getAllProducts, getBestSellingRanks } from "@/lib/db/supabase-products";
import { getAllSections } from "@/lib/db/supabase-sections";
import { getPricingOptionsForProducts } from "@/lib/db/supabase-pricing-options";
import { CatalogView } from "@/components/catalog/CatalogView";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const url = `${getSiteUrl()}/products`;

  return {
    title: settings.products_page_title,
    description: settings.products_page_subtitle,
    alternates: { canonical: url },
    openGraph: {
      title: settings.products_page_title,
      description: settings.products_page_subtitle,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: settings.products_page_title,
      description: settings.products_page_subtitle,
    },
  };
}

export default async function ProductsPage() {
  const settings = await getSiteSettings();
  const [sections, products] = await Promise.all([getAllSections(), getAllProducts()]);
  const pricingOptionsByProduct = await getPricingOptionsForProducts(products.map((p) => p.id));
  const bestSellingRank = await getBestSellingRanks(200);
  const siteUrl = getSiteUrl();

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/product/${product.slug}`,
      name: product.name,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <div className="border-b border-gray-200 bg-white py-10 text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-gray-900">{settings.products_page_title}</h1>
          <p className="mx-auto mt-2 max-w-2xl text-gray-600">{settings.products_page_subtitle}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Suspense fallback={null}>
          <CatalogView
            sections={sections}
            products={products}
            pricingOptionsEntries={Array.from(pricingOptionsByProduct.entries())}
            bestSellingRank={bestSellingRank}
          />
        </Suspense>
      </div>
    </>
  );
}
