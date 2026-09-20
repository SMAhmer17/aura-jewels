import { cn } from "@/lib/utils/cn";

/**
 * The "AURA JEWELS / BY ZAS" lockup, sized to whatever box it sits in. It scales with the box's width and
 * drops the smaller lines when the box is tiny (a thumbnail shows just AURA). Used inside loading
 * placeholders, so the parent must be a container: give it the `@container` class on an element that gets
 * its size from outside.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("pointer-events-none flex select-none flex-col items-center leading-none", className)}>
      <span className="pl-[0.3em] font-heading text-[clamp(8px,16cqw,30px)] tracking-[0.3em] text-ink/30">AURA</span>
      <span className="mt-[0.9em] hidden pl-[0.55em] font-heading text-[clamp(5px,7cqw,13px)] tracking-[0.55em] text-ink/30 @[72px]:block">JEWELS</span>
      <span className="mt-[1em] hidden pl-[0.35em] text-[clamp(5px,4.5cqw,9px)] tracking-[0.35em] text-gold/80 @[110px]:block">BY ZAS</span>
    </span>
  );
}
