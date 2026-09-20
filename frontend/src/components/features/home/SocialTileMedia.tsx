"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { FadeImage } from "@/components/ui/FadeImage";
import { ProductImagePlaceholder } from "@/components/features/product/ProductImagePlaceholder";
import type { SocialPost } from "@/types/home-content";
import { cn } from "@/lib/utils/cn";

/** A silent, looping video that plays while it is on screen and pauses when scrolled away. */
function AutoplayVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [readySrc, setReadySrc] = useState<string | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // Autoplay is only allowed for muted videos, so make sure of it before playing.
    video.muted = true;
    // People who ask their device to reduce motion get the first frame instead of moving video.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => undefined);
        else video.pause();
      },
      { threshold: 0.4 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  // A shimmer covers the tile until the first frame is ready, then the video fades in.
  const ready = readySrc === src;
  return (
    <>
      {!ready && <span aria-hidden className="shimmer absolute inset-0" />}
      <video
        ref={ref}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
        onLoadedData={() => setReadySrc(src)}
        className={cn(className, "transition-opacity duration-500 motion-reduce:transition-none", ready ? "opacity-100" : "opacity-0")}
      />
    </>
  );
}

/** The picture or video for a home page social tile, or a placeholder when none was added. */
export function SocialTileMedia({ post, className }: { post: SocialPost; className?: string }) {
  const media = cn("h-full w-full object-cover", className);
  if (post.mediaUrl && post.mediaType === "video") {
    return (
      <>
        <AutoplayVideo src={post.mediaUrl} className={media} />
        <span aria-hidden className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink/60 text-ivory">
          <Play size={12} className="fill-current" />
        </span>
      </>
    );
  }
  const placeholder = <ProductImagePlaceholder id={`social-${post.id}`} className={media} />;
  if (post.mediaUrl) return <FadeImage src={post.mediaUrl} alt={post.caption} className={media} fallback={placeholder} />;
  return placeholder;
}
