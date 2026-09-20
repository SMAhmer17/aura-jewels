import { ProductImagePlaceholder } from "@/components/features/product/ProductImagePlaceholder";
import { cn } from "@/lib/utils/cn";

/** Shows the product's uploaded image at `index`, or the branded placeholder when none exists. */
export function ProductImage({
  id,
  images,
  index = 0,
  alt = "",
  className,
}: {
  id: string;
  images?: string[];
  index?: number;
  alt?: string;
  className?: string;
}) {
  const src = images?.[index];
  if (src) {
    // Uploaded images are data URLs or external links, which next/image cannot optimise.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading="lazy" draggable={false} className={cn("object-cover", className)} />;
  }
  return <ProductImagePlaceholder id={index === 0 ? id : `${id}-${index}`} className={className} />;
}
