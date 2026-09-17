import { Sparkles } from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";

export interface ComingSoonProps {
  eyebrow?: string;
  title: string;
  description?: string;
  ctaHref?: string;
  ctaLabel?: string;
}

export function ComingSoon({
  eyebrow = "Aura Jewels",
  title,
  description = "This page is being crafted with the same care as our jewellery. Check back soon.",
  ctaHref = "/",
  ctaLabel = "Return Home",
}: ComingSoonProps) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-5 px-6 py-24 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold text-gold">
        <Sparkles size={20} />
      </span>
      <p className="text-xs uppercase tracking-widest text-gold">{eyebrow}</p>
      <h1 className="text-3xl text-ink sm:text-4xl">{title}</h1>
      <p className="text-sm text-muted">{description}</p>
      <LinkButton href={ctaHref} variant="primary" size="md" className="mt-2">
        {ctaLabel}
      </LinkButton>
    </div>
  );
}
