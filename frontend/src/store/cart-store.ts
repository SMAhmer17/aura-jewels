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
      clear: () => set({ items: [] }),
    }),
    { name: "aura-jewels-cart", skipHydration: true },
  ),
);
