import type { SiteSettings } from "@/lib/types";

export function AboutSection({ settings }: { settings: SiteSettings }) {
  return (
    <section id="about" className="scroll-mt-20 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="section-heading">{settings.about_title}</h2>
        <p className="mt-6 text-lg leading-relaxed text-gray-600">{settings.about_text}</p>
      </div>
    </section>
  );
}
