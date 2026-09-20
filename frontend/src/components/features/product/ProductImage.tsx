import { FadeImage } from "@/components/ui/FadeImage";
import { ProductImagePlaceholder } from "@/components/features/product/ProductImagePlaceholder";

/**
 * Shows the product's uploaded image at `index` with a loading shimmer and a fade-in, or the branded
 * placeholder when none exists (or when the picture fails to load).
 */
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
  const placeholder = <ProductImagePlaceholder id={index === 0 ? id : `${id}-${index}`} className={className} />;
  if (!src) return placeholder;
  return <FadeImage src={src} alt={alt} className={className} fallback={placeholder} />;
}
