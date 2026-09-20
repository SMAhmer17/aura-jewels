"use client";

import { Quote } from "lucide-react";
import { useHomeContent } from "@/lib/services/home-content-service";
import { Reveal } from "@/components/ui/Reveal";
import { StarRating } from "@/components/ui/StarRating";

export function TestimonialsSection() {
  const { testimonials } = useHomeContent();
  if (testimonials.items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
      <Reveal className="mx-auto mb-12 max-w-xl text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">{testimonials.eyebrow}</p>
        <h2 className="mt-3 text-3xl text-ink sm:text-4xl">{testimonials.heading}</h2>
      </Reveal>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {testimonials.items.map((t, i) => (
          <Reveal key={t.id} delay={(i % 3) * 100}>
            <figure className="flex h-full flex-col gap-4 rounded-(--radius-md) border border-border bg-surface p-7 shadow-(--shadow-soft)">
              <Quote size={22} className="text-gold" />
              <StarRating value={t.rating} />
              <blockquote className="flex-1 text-base leading-relaxed text-ink">{t.quote}</blockquote>
              <figcaption className="text-sm text-muted">
                <span className="text-ink">{t.name}</span>
                {t.city && `, ${t.city}`}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
