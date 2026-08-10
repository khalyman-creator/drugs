import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getAllProducts } from "@/lib/db/supabase-products";
import { getSectionById } from "@/lib/db/supabase-sections";
import {
  getPricingOptionsForProduct,
  getPricingOptionsForProducts,
} from "@/lib/db/supabase-pricing-options";
import { getImagesForProduct } from "@/lib/db/supabase-product-images";
import { ProductPageClient } from "@/components/ProductPageClient";
import { ProductCarousel } from "@/components/ProductCarousel";
import { getSiteUrl } from "@/lib/env";
import { getDisplayFromPrice, getPricingMode } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const url = `${getSiteUrl()}/product/${product.slug}`;
  const description = product.description || `${product.name} — shop it now.`;

  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: product.name,
      description,
      url,
      images: product.image_url ? [{ url: product.image_url }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: product.image_url ? [product.image_url] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const section = await getSectionById(product.section_id);
  const allProducts = await getAllProducts();
  const sameSection = allProducts.filter(
    (p) => p.id !== product.id && p.section_id === product.section_id
  );
  const otherSection = allProducts.filter(
    (p) => p.id !== product.id && p.section_id !== product.section_id
  );
  const related = [...sameSection, ...otherSection].slice(0, 8);
  const pricingOptions = await getPricingOptionsForProduct(product.id);
  const relatedPricingOptions = await getPricingOptionsForProducts(related.map((p) => p.id));
  const galleryImages = await getImagesForProduct(product.id);

  const price =
    getPricingMode(product.section_id) === "standard"
      ? product.price
      : getDisplayFromPrice(pricingOptions, product.price);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: product.image_url
      ? [product.image_url, ...galleryImages.map((img) => img.image_url)]
      : undefined,
    sku: String(product.id),
    url: `${getSiteUrl()}/product/${product.slug}`,
    offers: {
      "@type": "Offer",
      url: `${getSiteUrl()}/product/${product.slug}`,
      priceCurrency: "USD",
      price,
      availability: "https://schema.org/InStock",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: getSiteUrl() },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${getSiteUrl()}/products` },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${getSiteUrl()}/product/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <ProductPageClient
          product={product}
          sectionName={section?.name ?? "Shop"}
          pricingOptions={pricingOptions}
          galleryImages={galleryImages}
        />
      </div>

      <ProductCarousel
        title="You May Also Like"
        subtitle="More from the collection."
        products={related}
        pricingOptionsByProduct={relatedPricingOptions}
        seeAllHref="/products"
      />
    </>
  );
}
