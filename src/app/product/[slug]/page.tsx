import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getAllProducts, getSectionById } from "@/lib/db";
import { getReviewsByProduct, getReviewSummary, getAllReviewSummaries } from "@/lib/reviews";
import { ProductPageClient } from "@/components/ProductPageClient";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const section = getSectionById(product.section_id);
  const summary = getReviewSummary(product.id);
  const reviews = getReviewsByProduct(product.id, 100);
  const allProducts = getAllProducts();
  const summaries = getAllReviewSummaries();
  const related = allProducts.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <ProductPageClient
        product={product}
        sectionName={section?.name ?? "Shop"}
        reviewSummary={summary}
        reviews={reviews}
      />

      {related.length > 0 && (
        <section className="mt-16 border-t border-gray-200 pt-12">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Related Products</h2>
          <p className="mb-8 text-sm text-gray-500">You may also like these items</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} reviewSummary={summaries[p.id]} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/products" className="btn-outline">
              View All Products
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
