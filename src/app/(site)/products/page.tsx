import Link from "next/link";
import { getSiteSettings } from "@/lib/db/supabase-settings";
import { getProductsBySection, searchProducts } from "@/lib/db/supabase-products";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const settings = await getSiteSettings();
  const sections = await getProductsBySection();
  const results = query ? await searchProducts(query) : null;

  return (
    <>
      <div className="border-b border-gray-200 bg-white py-10 text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {query ? "Search Results" : settings.products_page_title}
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-gray-600">
            {query
              ? results?.length
                ? `${results.length} product${results.length === 1 ? "" : "s"} matching “${query}”`
                : `No products found for “${query}”`
              : settings.products_page_subtitle}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {query ? (
          results && results.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
              <p className="text-gray-600">Try a different search term or browse all products.</p>
              <Link
                href="/products"
                className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
              >
                Browse All Products
              </Link>
            </div>
          )
        ) : (
          <>
            <div className="mb-10 flex flex-wrap justify-center gap-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#section-${section.id}`}
                  className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:border-brand-500 hover:text-brand-700"
                >
                  {section.name}
                </a>
              ))}
            </div>

            <div className="space-y-16">
              {sections.map((section) => (
                <section key={section.id} id={`section-${section.id}`} className="scroll-mt-24">
                  <div className="mb-6 border-b border-gray-200 pb-3">
                    <h2 className="text-2xl font-bold text-gray-900">{section.name}</h2>
                    <p className="text-sm text-gray-500">{section.products.length} products</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {section.products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
