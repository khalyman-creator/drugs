import Link from "next/link";
import type { SiteSettings } from "@/lib/types";

export function Hero({ settings }: { settings: SiteSettings }) {
  return (
    <section className="bg-grain relative overflow-hidden border-b-2 border-gray-900 bg-gray-900">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div className="relative">
          <span className="accent-bar" />
          <h1 className="font-display mt-4 text-4xl uppercase leading-[0.95] tracking-tight text-white sm:text-6xl">
            {settings.hero_title}
          </h1>
          <p className="mt-5 max-w-md text-lg text-gray-400">{settings.hero_subtitle}</p>
          <Link
            href="/products"
            className="font-display mt-8 inline-flex items-center justify-center gap-2 rounded-sm border-2 border-brand-600 bg-brand-600 px-7 py-3.5 text-sm uppercase tracking-wide text-white transition hover:bg-transparent"
          >
            {settings.hero_button_text}
          </Link>
        </div>
        <div className="relative">
          <div className="absolute -left-3 -top-3 z-10 h-8 w-20 -rotate-6 bg-white/80 shadow-sm" />
          <div className="absolute -right-3 -top-3 z-10 h-8 w-20 rotate-6 bg-white/80 shadow-sm" />
          <div className="overflow-hidden rounded-sm border-2 border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.hero_image_url}
              alt=""
              className="aspect-video w-full object-cover grayscale contrast-125"
            />
            <div className="pointer-events-none absolute inset-0 bg-brand-600 mix-blend-color" />
          </div>
        </div>
      </div>
    </section>
  );
}
