"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductImage } from "@/components/features/product/ProductImage";
import { cn } from "@/lib/utils/cn";

const PLACEHOLDER_COUNT = 4;
const LENS_SIZE = 190;
const ZOOM = 2.5;

interface Lens {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Swipeable (scroll-snap) image carousel with arrow buttons, thumbnails, hover zoom, and keyboard support. */
export function ProductGallery({ productId, name, images }: { productId: string; name: string; images?: string[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [lens, setLens] = useState<Lens | null>(null);
  const count = images && images.length > 0 ? images.length : PLACEHOLDER_COUNT;

  function goTo(target: number) {
    const el = trackRef.current;
    if (!el) return;
    const next = (target + count) % count;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }

  function handleScroll() {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  // Mouse only: touch users keep swiping instead of getting a lens stuck under their finger.
  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setLens({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height });
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowLeft") goTo(index - 1);
    if (e.key === "ArrowRight") goTo(index + 1);
  }

  const arrowClass =
    "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-ivory/60 text-ink backdrop-blur-md transition-colors hover:bg-ivory hover:text-gold";

  return (
    <div className="flex flex-col gap-3" role="region" aria-roledescription="carousel" aria-label={`${name} images`}>
      <div className="relative" onKeyDown={handleKeyDown}>
        <div
          ref={trackRef}
          onScroll={handleScroll}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setLens(null)}
          tabIndex={0}
          className="flex cursor-zoom-in snap-x snap-mandatory overflow-x-auto rounded-(--radius-md) border border-border [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold [&::-webkit-scrollbar]:hidden"
        >
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="aspect-square w-full shrink-0 snap-center" aria-label={`Image ${i + 1} of ${count}`}>
              <ProductImage id={productId} images={images} index={i} alt={`${name}, image ${i + 1}`} className="h-full w-full" />
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button type="button" aria-label="Previous image" onClick={() => goTo(index - 1)} className={cn(arrowClass, "left-3")}>
              <ChevronLeft size={20} />
            </button>
            <button type="button" aria-label="Next image" onClick={() => goTo(index + 1)} className={cn(arrowClass, "right-3")}>
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {lens && (
          <div
            aria-hidden
            className="pointer-events-none absolute z-20 overflow-hidden rounded-full border-2 border-gold bg-ivory shadow-(--shadow-elevated)"
            style={{ width: LENS_SIZE, height: LENS_SIZE, left: lens.x - LENS_SIZE / 2, top: lens.y - LENS_SIZE / 2 }}
          >
            <div
              className="absolute"
              style={{
                width: lens.w * ZOOM,
                height: lens.h * ZOOM,
                left: LENS_SIZE / 2 - lens.x * ZOOM,
                top: LENS_SIZE / 2 - lens.y * ZOOM,
              }}
            >
              <ProductImage id={productId} images={images} index={index} className="h-full w-full" />
            </div>
          </div>
        )}

        {count > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-ink/60 px-3 py-1 text-xs text-ivory backdrop-blur-sm">
            {index + 1} / {count}
          </span>
        )}
      </div>

      {count > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "aspect-square overflow-hidden rounded-(--radius-sm) border transition-colors",
                i === index ? "border-gold ring-1 ring-gold" : "border-border hover:border-ink",
              )}
            >
              <ProductImage id={productId} images={images} index={i} className="h-full w-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
