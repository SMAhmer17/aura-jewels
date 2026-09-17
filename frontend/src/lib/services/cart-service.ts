import { useMemo } from "react";
import { useCartStore } from "@/store/cart-store";
import { useCatalogStore } from "@/store/catalog-store";
import { useSettingsStore } from "@/store/settings-store";
import type { Product, ProductVariant } from "@/types/product";

export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
  product: Product;
  variant: ProductVariant;
}

export function useCartLines(): CartLine[] {
  const items = useCartStore((state) => state.items);
  const products = useCatalogStore((state) => state.products);

  return useMemo(
    () =>
      items.flatMap((item) => {
        const product = products.find((p) => p.id === item.productId);
        const variant = product?.variants.find((v) => v.id === item.variantId);
        if (!product || !variant) return [];
        return [{ ...item, product, variant }];
      }),
    [items, products],
  );
}

export function useCartCount(): number {
  return useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
}

export function useShippingCost(subtotal: number): number {
  const { shippingFlatRate, freeShippingThreshold } = useSettingsStore((s) => s.settings);
  if (subtotal === 0) return 0;
  return subtotal >= freeShippingThreshold ? 0 : shippingFlatRate;
}

export function addToCart(productId: string, variantId: string, quantity = 1) {
  useCartStore.getState().addItem(productId, variantId, quantity);
}

export function removeFromCart(productId: string, variantId: string) {
  useCartStore.getState().removeItem(productId, variantId);
}

export function updateCartQuantity(productId: string, variantId: string, quantity: number) {
  useCartStore.getState().updateQuantity(productId, variantId, quantity);
}

export function clearCart() {
  useCartStore.getState().clear();
}
