import { ShieldCheck, Gem, Heart } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const values = [
  {
    icon: Gem,
    title: "Considered Design",
    description: "Every piece starts as a sketch, refined until it earns its place in the collection.",
  },
  {
    icon: ShieldCheck,
    title: "Quality You Can Trust",
    description: "Each order is inspected by hand before it leaves our studio.",
  },
  {
    icon: Heart,
    title: "Made for Real Life",
    description: "Pieces designed to be worn often, not saved for a drawer.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      <section className="flex flex-col items-center gap-4 bg-ink px-6 py-20 text-center text-ivory">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Our Story</p>
        <h1 className="max-w-xl text-4xl sm:text-5xl">Jewellery, made with intention</h1>
        <p className="max-w-md text-sm text-muted">
          Aura Jewels by ZAS started with a simple idea: everyday jewellery should feel just as
          considered as an occasion piece.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-base leading-relaxed text-ink">
          We design in Pakistan, for people who want jewellery that feels personal, pieces that
          hold up to daily wear without losing the details that made you pick them up in the
          first place. From a single solitaire to a full bridal set, every design goes through
          several rounds of refinement before it reaches the collection.
        </p>
      </section>

      <section className="border-t border-border bg-cream/50 px-6 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 sm:grid-cols-3">
          {values.map(({ icon: Icon, title, description }, i) => (
            <Reveal key={title} delay={i * 100}>
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold text-gold">
                  <Icon size={20} />
                </span>
                <h3 className="text-lg text-ink">{title}</h3>
                <p className="text-sm text-muted">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
