import Link from "next/link";
import type { SiteSettings } from "@/lib/types";

export function AboutSection({ settings }: { settings: SiteSettings }) {
  const excerpt = settings.about_text.replace(/^##\s+/gm, "");

  return (
    <section id="about" className="bg-grain scroll-mt-20 border-y-2 border-gray-900 bg-gray-900 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-display text-3xl uppercase leading-none tracking-tight text-white sm:text-5xl">
          {settings.about_title}
        </h2>
        <span className="accent-bar mx-auto" />
        <p className="mt-6 line-clamp-3 text-lg leading-relaxed text-gray-400">{excerpt}</p>
        <Link
          href="/about"
          className="mt-4 inline-block text-sm font-bold uppercase tracking-wide text-brand-500 hover:text-brand-400"
        >
          Read More
        </Link>
      </div>
    </section>
  );
}
