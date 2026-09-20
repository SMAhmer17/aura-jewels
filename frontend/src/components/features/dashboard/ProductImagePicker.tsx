"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Upload, X } from "lucide-react";
import { uploadProductImage } from "@/lib/services/uploads-service";
import { errorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils/cn";

interface Props {
  images: string[];
  /** Receives an updater so several changes in a row never overwrite each other. */
  onChange: (update: (previous: string[]) => string[]) => void;
  min: number;
  max: number;
  /** Lets the form disable "Save" while photos are still uploading. */
  onBusyChange?: (busy: boolean) => void;
  /** When set, clicking a photo selects it (for a larger preview elsewhere). */
  selectedIndex?: number;
  onSelect?: (index: number) => void;
}

/**
 * Product photo manager: pick or drop photos, see a preview of each one, remove any of them,
 * and choose which one is the thumbnail (the first image, shown on cards and lists).
 */
export function ProductImagePicker({ images, onChange, min, max, onBusyChange, selectedIndex, onSelect }: Props) {
  const inputId = useId();
  const [pending, setPending] = useState(0);
  const pendingRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const room = Math.max(0, max - images.length - pending);
  const emptySlots = Math.max(0, Math.min(min, max) - images.length - pending);

  function trackPending(delta: number) {
    pendingRef.current += delta;
    setPending(pendingRef.current);
    onBusyChange?.(pendingRef.current > 0);
  }

  async function addFiles(fileList: FileList | File[] | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      toast({ title: "Choose image files", description: "Only JPEG, PNG or WebP photos can be uploaded.", variant: "error" });
      return;
    }
    const picked = files.slice(0, room);
    if (files.length > picked.length) {
      toast({ title: `Up to ${max} images per product`, description: "Extra files were skipped." });
    }
    if (picked.length === 0) return;

    trackPending(picked.length);
    // Upload together, then add them in the order they were chosen.
    const results = await Promise.allSettled(picked.map((file) => uploadProductImage(file)));
    const urls = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    if (urls.length > 0) onChange((prev) => [...prev, ...urls].slice(0, max));
    if (failed) {
      const count = results.length - urls.length;
      toast({
        title: count === 1 ? "One image could not be uploaded" : `${count} images could not be uploaded`,
        description: errorMessage(failed.reason, "Check the files and try again."),
        variant: "error",
      });
    }
    trackPending(-picked.length);
  }

  function addLink() {
    const url = imageUrl.trim();
    if (!/^https?:\/\//.test(url)) {
      toast({ title: "Enter a full image link starting with https://", variant: "error" });
      return;
    }
    if (room === 0) {
      toast({ title: `Up to ${max} images per product` });
      return;
    }
    onChange((prev) => [...prev, url]);
    setImageUrl("");
  }

  function makeThumbnail(index: number) {
    onChange((prev) => {
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      return [picked, ...next];
    });
    onSelect?.(0);
  }

  function remove(index: number) {
    onChange((prev) => prev.filter((_, i) => i !== index));
  }

  const short = images.length + pending < min;

  return (
    <div
      className={cn("flex flex-col gap-4 rounded-(--radius-md) border p-4 transition-colors", dragging ? "border-gold bg-gold/5" : "border-border")}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void addFiles(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-sm font-medium text-ink">Product images</span>
          <p className="text-xs text-muted">
            Add at least {min} photos (up to {max}). Drag photos here or use the button. Pick the one you want as the thumbnail, it is what shows on cards and lists.
          </p>
        </div>
        <span className={cn("shrink-0 text-xs", short ? "text-error" : "text-muted")}>
          {images.length} of {max} added{short ? ` (minimum ${min})` : ""}
        </span>
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-3">
        {images.map((src, i) => {
          const isThumbnail = i === 0;
          return (
            <li key={`${i}-${src.slice(-24)}`} className="flex flex-col gap-2">
              <div className={cn("relative aspect-square overflow-hidden rounded-(--radius-sm) border bg-cream", isThumbnail ? "border-gold ring-1 ring-gold" : "border-border", onSelect && selectedIndex === i && "outline-2 outline-offset-2 outline-ink")}>
                {onSelect ? (
                  <button type="button" onClick={() => onSelect(i)} aria-label={`View image ${i + 1}`} className="block h-full w-full cursor-zoom-in">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Product image ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={`Product image ${i + 1}`} className="h-full w-full object-cover" />
                )}
                <button
                  type="button"
                  aria-label={`Remove image ${i + 1}`}
                  onClick={() => remove(i)}
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink/75 text-ivory transition-colors hover:bg-error focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <X size={14} />
                </button>
              </div>
              <button
                type="button"
                aria-pressed={isThumbnail}
                disabled={isThumbnail}
                onClick={() => makeThumbnail(i)}
                className={cn(
                  "inline-flex h-9 items-center justify-center gap-1.5 rounded-(--radius-sm) border px-1 text-xs transition-colors",
                  isThumbnail ? "border-gold bg-gold/10 text-ink" : "border-border text-muted hover:border-ink hover:text-ink",
                )}
              >
                <Star size={12} className={isThumbnail ? "fill-gold text-gold" : ""} />
                {isThumbnail ? "Thumbnail" : "Make thumbnail"}
              </button>
            </li>
          );
        })}

        {Array.from({ length: pending }).map((_, i) => (
          <li key={`pending-${i}`} className="flex flex-col gap-2" aria-label="Uploading image">
            <div className="flex aspect-square animate-pulse items-center justify-center rounded-(--radius-sm) border border-border bg-cream text-muted">
              <Loader2 size={20} className="animate-spin" />
            </div>
            <span className="text-center text-xs text-muted">Uploading...</span>
          </li>
        ))}

        {Array.from({ length: emptySlots }).map((_, i) => {
          const slot = images.length + pending + i;
          return (
            <li key={`empty-${slot}`}>
              <label
                htmlFor={inputId}
                className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-(--radius-sm) border border-dashed border-border text-center text-xs text-muted transition-colors hover:border-gold hover:text-ink"
              >
                <ImagePlus size={20} />
                {slot === 0 ? "Thumbnail" : `Image ${slot + 1}`}
              </label>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={inputId}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-(--radius-sm) border border-gold px-4 text-sm text-ink transition-colors focus-within:ring-2 focus-within:ring-gold",
            room === 0 ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-gold/10",
          )}
        >
          <Upload size={14} />
          {pending > 0 ? "Uploading..." : "Upload images"}
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={room === 0}
            className="sr-only"
            data-testid="product-image-input"
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <span className="text-xs text-muted">JPEG, PNG or WebP, up to 5 MB each</span>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input label="Or add an image link" placeholder="https://" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>
        <Button type="button" variant="outline" size="md" onClick={addLink}>
          Add
        </Button>
      </div>
    </div>
  );
}
