"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/types/product";
import { ProductImagePlaceholder } from "@/components/features/product/ProductImagePlaceholder";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils/currency";
import { toast } from "@/store/toast-store";
import { toggleWishlist, useIsWishlisted } from "@/lib/services/wishlist-service";
import { cn } from "@/lib/utils/cn";

export function ProductCard({ product }: { product: Product }) {
  const inStock = product.variants.some((v) => v.stock > 0);
  const isWishlisted = useIsWishlisted(product.id);

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    toggleWishlist(product.id);
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Saved to wishlist",
      description: product.name,
    });
  }

  return (
    <Link href={`/product/${product.slug}`} className="group flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-(--radius-md) border border-border">
        <ProductImagePlaceholder
          id={product.id}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        <button
          type="button"
          onClick={handleWishlist}
          aria-label="Add to wishlist"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-ink shadow-(--shadow-soft) transition-colors hover:text-gold"
        >
          <Heart size={16} className={cn(isWishlisted && "fill-gold text-gold")} />
        </button>
        {!inStock && (
          <Badge variant="dark" className="absolute left-3 top-3">
            Sold Out
          </Badge>
        )}
        {inStock && product.compareAtPrice && (
          <Badge variant="gold" className="absolute left-3 top-3">
            Sale
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base text-ink">{product.name}</h3>
        <p className="text-xs text-muted">{product.material}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink">{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-xs text-muted line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
