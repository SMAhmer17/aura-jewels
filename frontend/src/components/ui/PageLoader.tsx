import { cn } from "@/lib/utils/cn";

/**
 * The loading screen for a whole page: the brand name centered in the space, with a gold line sweeping under
 * it. It fades in after a short moment, so pages that load quickly never flash it. Picture-level loading is
 * handled separately by FadeImage.
 */
export function PageLoader({ label = "Loading", fullScreen = false }: { label?: string; fullScreen?: boolean }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-4 animate-[loader-in_300ms_ease-out_150ms_both] motion-reduce:animate-none",
        fullScreen ? "min-h-dvh" : "min-h-[60vh]",
      )}
    >
      <span className="pl-[0.3em] font-heading text-2xl tracking-[0.3em] text-ink sm:text-3xl">AURA JEWELS</span>
      <span aria-hidden className="pl-[0.4em] text-[10px] tracking-[0.4em] text-gold">BY ZAS</span>
      <span aria-hidden className="shimmer-gold relative mt-2 h-px w-40" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
