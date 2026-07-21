import { getSiteSettings } from "@/lib/db/supabase-settings";
import { getAllProducts } from "@/lib/db/supabase-products";
import { Hero } from "@/components/Hero";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { AboutSection } from "@/components/AboutSection";
import { Testimonials } from "@/components/Testimonials";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSiteSettings();
  const products = await getAllProducts();

  return (
    <>
      <Hero settings={settings} />
      <FeaturedProducts products={products} title="Featured Products" />
      <AboutSection settings={settings} />
      <Testimonials settings={settings} />
    </>
  );
}
