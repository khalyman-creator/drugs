import type { Review, SiteSettings } from "@/lib/types";
import { ReviewForm } from "./ReviewForm";

export function Testimonials({
  settings,
  reviews,
}: {
  settings: SiteSettings;
  reviews: Review[];
}) {
  const rotations = ["-rotate-1", "rotate-1", "-rotate-2"];

  return (
    <section className="bg-brand-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="section-heading">{settings.testimonials_title}</h2>
        <span className="accent-bar" />
        <p className="section-sub">{settings.testimonials_subtitle}</p>

        {reviews.length > 0 && (
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {reviews.map((item, i) => (
              <div
                key={item.id}
                className={`${rotations[i % rotations.length]} rounded-sm border-2 border-gray-900 bg-white p-6 shadow-[4px_4px_0_0_rgba(17,24,39,1)] transition hover:rotate-0`}
              >
                <span className="font-display text-3xl leading-none text-brand-600">&ldquo;</span>
                <p className="-mt-2 text-gray-700">{item.comment}</p>
                <p className="font-display mt-4 text-sm uppercase tracking-wide text-gray-900">
                  — {item.name}
                </p>
              </div>
            ))}
          </div>
        )}

        <ReviewForm />
      </div>
    </section>
  );
}
