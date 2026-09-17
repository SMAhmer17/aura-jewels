import { useMemo } from "react";
import { useWishlistStore } from "@/store/wishlist-store";
import { useCatalogStore } from "@/store/catalog-store";
import type { Product } from "@/types/product";

export function useWishlistProducts(): Product[] {
  const ids = useWishlistStore((state) => state.productIds);
  const products = useCatalogStore((state) => state.products);
  return useMemo(() => ids.flatMap((id) => products.find((p) => p.id === id) ?? []), [ids, products]);
}

export function useIsWishlisted(productId: string): boolean {
  return useWishlistStore((state) => state.productIds.includes(productId));
}

export function toggleWishlist(productId: string) {
  useWishlistStore.getState().toggle(productId);
}
