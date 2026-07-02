import type { SiteSettings } from "@/lib/types";

export function Testimonials({ settings }: { settings: SiteSettings }) {
  const items = [
    { name: settings.testimonial_1_name, text: settings.testimonial_1_text },
    { name: settings.testimonial_2_name, text: settings.testimonial_2_text },
    { name: settings.testimonial_3_name, text: settings.testimonial_3_text },
  ];

  return (
    <section className="bg-brand-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="section-heading">What Our Customers Say</h2>
        <p className="section-sub">Real feedback — edit these testimonials in your admin dashboard.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm"
            >
              <p className="text-gray-600">&ldquo;{item.text}&rdquo;</p>
              <p className="mt-4 font-semibold text-brand-800">— {item.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
