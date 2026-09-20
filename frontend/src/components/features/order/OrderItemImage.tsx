"use client";

import { ProductImage } from "@/components/features/product/ProductImage";
import { useCatalogStore } from "@/store/catalog-store";
import type { OrderItem } from "@/types/order";
import { cn } from "@/lib/utils/cn";

/**
 * The picture of what was ordered. Uses the cover photo saved on the order line when it was placed; for older
 * orders without one it falls back to the product's current cover, then to the branded placeholder.
 */
export function OrderItemImage({ item, className }: { item: Pick<OrderItem, "productId" | "name" | "image">; className?: string }) {
  const fallback = useCatalogStore((s) => {
    if (item.image || !item.productId) return undefined;
    return (s.adminProducts.find((p) => p.id === item.productId) ?? s.products.find((p) => p.id === item.productId))?.images?.[0];
  });
  const src = item.image ?? fallback;
  return (
    <div className={cn("h-12 w-12 shrink-0 overflow-hidden rounded-(--radius-sm) border border-border bg-cream", className)}>
      <ProductImage id={item.productId ?? item.name} images={src ? [src] : undefined} alt={item.name} className="h-full w-full" />
    </div>
  );
}
