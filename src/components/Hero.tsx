import Link from "next/link";
import type { SiteSettings } from "@/lib/types";

export function Hero({ settings }: { settings: SiteSettings }) {
  return (
    <section className="border-b border-gray-200 bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">{settings.hero_title}</h1>
          <p className="mt-4 text-lg text-gray-600">{settings.hero_subtitle}</p>
          <Link href="/products" className="btn-primary mt-8">
            {settings.hero_button_text}
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={settings.hero_image_url}
            alt=""
            className="aspect-video w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
