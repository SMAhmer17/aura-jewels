"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/ui/BrandMark";
import { cn } from "@/lib/utils/cn";

interface FadeImageProps {
  src: string;
  alt?: string;
  /** Sizing for the frame around the picture (for example "h-full w-full"). */
  className?: string;
  /** Classes for the picture itself. Defaults to filling the frame and cropping to fit. */
  imgClassName?: string;
  /** Shown instead if the picture cannot be loaded. */
  fallback?: ReactNode;
  loading?: "lazy" | "eager";
}

/**
 * An image that shows a soft shimmer while it loads and then fades in, so pages never pop or show empty boxes.
 * Pictures already in the browser's cache appear straight away. If loading fails, the fallback is shown.
 */
export function FadeImage({ src, alt = "", className, imgClassName, fallback, loading = "lazy" }: FadeImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  // Remember WHICH picture finished or failed, so a changed src starts loading again without extra resets.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  // A picture that was already cached can finish before React attaches onLoad, so check for that once.
  useEffect(() => {
    const el = ref.current;
    if (el?.complete && el.naturalWidth > 0) setLoadedSrc(src);
  }, [src]);

  if (failedSrc === src && fallback) return <>{fallback}</>;

  const loaded = loadedSrc === src;
  return (
    <span className={cn("relative block overflow-hidden", className)}>
      {!loaded && (
        <span aria-hidden className="shimmer absolute inset-0 flex items-center justify-center @container">
          <BrandMark />
        </span>
      )}
      {/* Pictures come from the API's storage or any web link, which next/image cannot optimise. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading={loading}
        draggable={false}
        onLoad={() => setLoadedSrc(src)}
        onError={() => setFailedSrc(src)}
        className={cn("h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none", loaded ? "opacity-100" : "opacity-0", imgClassName)}
      />
    </span>
  );
}
