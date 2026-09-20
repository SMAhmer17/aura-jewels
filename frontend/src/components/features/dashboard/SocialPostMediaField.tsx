"use client";

import { useId, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { MAX_VIDEO_MB, uploadPostMedia } from "@/lib/services/uploads-service";
import { errorMessage } from "@/lib/api/client";
import { FadeImage } from "@/components/ui/FadeImage";
import { toast } from "@/store/toast-store";
import type { SocialPost } from "@/types/home-content";

/** Preview plus upload and remove controls for the picture or video on one social tile. */
export function SocialPostMediaField({
  post,
  onChange,
}: {
  post: SocialPost;
  onChange: (media: Pick<SocialPost, "mediaUrl" | "mediaType">) => void;
}) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const { url, type } = await uploadPostMedia(file);
      onChange({ mediaUrl: url, mediaType: type });
    } catch (error) {
      toast({ title: "Could not upload the file", description: errorMessage(error, "Check the file and try again."), variant: "error" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex w-28 shrink-0 flex-col gap-2">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-(--radius-sm) border border-border bg-cream text-center text-xs text-muted">
        {uploading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : post.mediaUrl && post.mediaType === "video" ? (
          // Shows the first frame; the storefront plays it automatically.
          <video src={post.mediaUrl} muted playsInline preload="metadata" aria-label="Video preview" className="h-full w-full object-cover" />
        ) : post.mediaUrl ? (
          <FadeImage src={post.mediaUrl} alt="Tile preview" className="h-full w-full" />
        ) : (
          <span className="px-2">No photo or video</span>
        )}
        {post.mediaUrl && !uploading && (
          <button
            type="button"
            aria-label="Remove the photo or video"
            onClick={() => onChange({ mediaUrl: undefined, mediaType: undefined })}
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/75 text-ivory transition-colors hover:bg-error"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <label
        htmlFor={inputId}
        className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-(--radius-sm) border border-gold px-2 text-xs text-ink transition-colors hover:bg-gold/10 focus-within:ring-2 focus-within:ring-gold"
      >
        <Upload size={12} />
        {post.mediaUrl ? "Replace" : "Upload"}
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          disabled={uploading}
          className="sr-only"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      <p className="text-[11px] leading-snug text-muted">Photo, or MP4/WebM video up to {MAX_VIDEO_MB} MB. Videos play on their own, without sound.</p>
    </div>
  );
}
