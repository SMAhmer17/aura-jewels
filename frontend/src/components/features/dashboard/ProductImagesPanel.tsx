"use client";

import { useState } from "react";
import { updateProduct } from "@/lib/services/catalog-service";
import { errorMessage } from "@/lib/api/client";
import { ProductImagePicker } from "@/components/features/dashboard/ProductImagePicker";
import { ProductImagePlaceholder } from "@/components/features/product/ProductImagePlaceholder";
import { Button } from "@/components/ui/Button";
import { FadeImage } from "@/components/ui/FadeImage";
import { toast } from "@/store/toast-store";
import type { Product } from "@/types/product";

/**
 * Contents of the right-hand drawer opened from the products list: a large preview of the selected
 * photo, plus everything needed to manage them (pick the thumbnail, remove, add more). Saved to the API on "Save images".
 */
export function ProductImagesPanel({ product, min, max, onClose }: { product: Product; min: number; max: number; onClose: () => void }) {
  const original = product.images ?? [];
  const [images, setImages] = useState<string[]>(original);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const shown = Math.min(selected, Math.max(0, images.length - 1));
  const changed = images.length !== original.length || images.some((src, i) => src !== original[i]);

  async function save() {
    if (product.status === "active" && images.length < min) {
      toast({
        title: `Add at least ${min} images`,
        description: `This product has ${images.length}. Add more, or change it to a draft from Edit.`,
        variant: "error",
      });
      return;
    }
    setSaving(true);
    try {
      await updateProduct(product.id, { images });
      toast({ title: "Images saved", description: product.name, variant: "success" });
      onClose();
    } catch (error) {
      toast({ title: "Could not save the images", description: errorMessage(error), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col gap-5 p-6">
        <div>
          <p className="text-base text-ink">{product.name}</p>
          <p className="text-xs text-muted">Click a photo to preview it. Choose which one is the thumbnail, remove any you do not want, or add more.</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="aspect-square w-full overflow-hidden rounded-(--radius-md) border border-border bg-cream">
            {images.length > 0 ? (
              <FadeImage key={images[shown]} src={images[shown]} alt={`${product.name}, image ${shown + 1}`} className="h-full w-full" imgClassName="object-contain" loading="eager" />
            ) : (
              <ProductImagePlaceholder id={product.id} className="h-full w-full" />
            )}
          </div>
          {images.length > 0 && (
            <p className="text-center text-xs text-muted">
              Image {shown + 1} of {images.length}
              {shown === 0 ? " (thumbnail)" : ""}
            </p>
          )}
        </div>

        <ProductImagePicker images={images} onChange={(update) => setImages(update)} min={min} max={max} onBusyChange={setBusy} selectedIndex={shown} onSelect={setSelected} />
      </div>

      <div className="sticky bottom-0 mt-auto flex justify-end gap-3 border-t border-border bg-ivory px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={save} disabled={!changed || busy || saving}>
          {saving ? "Saving..." : "Save images"}
        </Button>
      </div>
    </div>
  );
}
