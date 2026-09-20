"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/types/product";
import { ProductImage } from "@/components/features/product/ProductImage";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils/currency";
import { toast } from "@/store/toast-store";
import { toggleWishlist, useIsWishlisted } from "@/lib/services/wishlist-service";
import { addToCart } from "@/lib/services/cart-service";
import { cn } from "@/lib/utils/cn";

export function ProductCard({ product }: { product: Product }) {
  const inStock = product.variants.some((v) => v.stock > 0);
  const isWishlisted = useIsWishlisted(product.id);
  const availableVariants = product.variants.filter((v) => v.stock > 0);
  const canQuickAdd = availableVariants.length === 1;

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    toggleWishlist(product.id);
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Saved to wishlist",
      description: product.name,
    });
  }

  function handleQuickAdd(e: React.MouseEvent) {
    // Multi-size products fall through to the link so the customer can pick a size on the product page.
    if (!canQuickAdd) return;
    e.preventDefault();
    addToCart(product.id, availableVariants[0].id);
    toast({ title: "Added to cart", description: product.name, variant: "success" });
  }

  return (
    // On hover the whole card lifts a little and its picture gains a soft shadow (only on devices that can hover).
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col gap-3 transition-transform duration-300 ease-out hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-square overflow-hidden rounded-(--radius-md) border border-border transition-[box-shadow,border-color] duration-300 group-hover:border-gold/40 group-hover:shadow-(--shadow-elevated)">
        <ProductImage
          id={product.id}
          images={product.images}
          alt={product.name}
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
        {inStock && (
          <button
            type="button"
            onClick={handleQuickAdd}
            className="absolute inset-x-0 bottom-0 hidden translate-y-full items-center justify-center bg-ink/85 py-3.5 text-xs font-medium uppercase tracking-[0.2em] text-ivory backdrop-blur-sm transition-transform duration-300 ease-out hover:bg-ink focus-visible:translate-y-0 group-hover:translate-y-0 group-focus-within:translate-y-0 sm:flex"
          >
            {canQuickAdd ? "Add to Cart" : "Select Option"}
          </button>
        )}
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
