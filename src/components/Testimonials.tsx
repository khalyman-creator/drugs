import type { SiteSettings } from "@/lib/types";

export function Testimonials({ settings }: { settings: SiteSettings }) {
  const items = [
    { name: settings.testimonial_1_name, text: settings.testimonial_1_text },
    { name: settings.testimonial_2_name, text: settings.testimonial_2_text },
    { name: settings.testimonial_3_name, text: settings.testimonial_3_text },
  ];

  const rotations = ["-rotate-1", "rotate-1", "-rotate-2"];

  return (
    <section className="bg-brand-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="section-heading">{settings.testimonials_title}</h2>
        <span className="accent-bar" />
        <p className="section-sub">{settings.testimonials_subtitle}</p>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={i}
              className={`${rotations[i % rotations.length]} rounded-sm border-2 border-gray-900 bg-white p-6 shadow-[4px_4px_0_0_rgba(17,24,39,1)] transition hover:rotate-0`}
            >
              <span className="font-display text-3xl leading-none text-brand-600">&ldquo;</span>
              <p className="-mt-2 text-gray-700">{item.text}</p>
              <p className="font-display mt-4 text-sm uppercase tracking-wide text-gray-900">— {item.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
