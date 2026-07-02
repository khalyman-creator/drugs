import { getSiteSettings, getAllProducts } from "@/lib/db";
import { Hero } from "@/components/Hero";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { AboutSection } from "@/components/AboutSection";
import { Testimonials } from "@/components/Testimonials";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const settings = getSiteSettings();
  const products = getAllProducts();

  return (
    <>
      <Hero settings={settings} />
      <FeaturedProducts products={products} title="Featured Products" />
      <AboutSection settings={settings} />
      <Testimonials settings={settings} />
    </>
  );
}
