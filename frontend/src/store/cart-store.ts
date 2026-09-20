import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (productId: string, variantId: string, quantity?: number) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  /** Drops lines whose size no longer exists in the catalog (removed or deleted since they were added). */
  prune: (validVariantIds: Set<string>) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (productId, variantId, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (item) => item.productId === productId && item.variantId === variantId,
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                item === existing ? { ...item, quantity: item.quantity + quantity } : item,
              ),
            };
          }
          return { items: [...state.items, { productId, variantId, quantity }] };
        }),
      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.productId === productId && item.variantId === variantId),
          ),
        })),
      updateQuantity: (productId, variantId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item,
          ),
        })),
      prune: (validVariantIds) =>
        set((state) => {
          const items = state.items.filter((item) => validVariantIds.has(item.variantId));
          return items.length === state.items.length ? state : { items };
        }),
      clear: () => set({ items: [] }),
    }),
    {
      name: "aura-jewels-cart",
      skipHydration: true,
      // v2: ids now come from the API, so carts saved with the old demo ids are discarded.
      version: 2,
      migrate: () => ({ items: [] }),
    },
  ),
);
