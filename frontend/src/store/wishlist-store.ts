import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  productIds: string[];
  toggle: (productId: string) => void;
  remove: (productId: string) => void;
  /** Drops products that no longer exist in the catalog. */
  prune: (validProductIds: Set<string>) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      productIds: [],
      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),
      remove: (productId) =>
        set((state) => ({ productIds: state.productIds.filter((id) => id !== productId) })),
      prune: (validProductIds) =>
        set((state) => {
          const productIds = state.productIds.filter((id) => validProductIds.has(id));
          return productIds.length === state.productIds.length ? state : { productIds };
        }),
    }),
    {
      name: "aura-jewels-wishlist",
      skipHydration: true,
      // v2: product ids now come from the API, so lists saved with the old demo ids are discarded.
      version: 2,
      migrate: () => ({ productIds: [] }),
    },
  ),
);
