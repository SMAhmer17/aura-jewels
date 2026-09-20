"use client";

import { Gem, ShieldCheck, Heart, Gift } from "lucide-react";
import { useHomeContent } from "@/lib/services/home-content-service";
import { Reveal } from "@/components/ui/Reveal";

const icons = [Gem, ShieldCheck, Heart, Gift];

export function WhyAuraSection() {
  const { why } = useHomeContent();
  if (why.points.length === 0) return null;

  return (
    <section className="bg-ink px-4 py-20 text-ivory sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto mb-14 max-w-xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{why.eyebrow}</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">{why.heading}</h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {why.points.map((point, i) => {
            const Icon = icons[i % icons.length];
            return (
              <Reveal key={point.id} delay={(i % 4) * 80}>
                <div className="flex flex-col items-center gap-4 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold text-gold">
                    <Icon size={22} />
                  </span>
                  <h3 className="text-xl">{point.title}</h3>
                  <p className="max-w-xs text-sm text-muted">{point.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
