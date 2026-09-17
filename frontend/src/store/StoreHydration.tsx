"use client";

import { useEffect } from "react";
import { useCatalogStore } from "@/store/catalog-store";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useOrdersStore } from "@/store/orders-store";
import { useSettingsStore } from "@/store/settings-store";
import { useDiscountsStore } from "@/store/discounts-store";
import { useAdminAuthStore } from "@/store/admin-auth-store";

/**
 * Persisted stores use skipHydration so SSR always renders seed data first;
 * this rehydrates from localStorage once mounted, avoiding a hydration mismatch.
 * Register every persisted store's rehydrate call here.
 */
export function StoreHydration() {
  useEffect(() => {
    useCatalogStore.persist.rehydrate();
    useCartStore.persist.rehydrate();
    useWishlistStore.persist.rehydrate();
    useOrdersStore.persist.rehydrate();
    useSettingsStore.persist.rehydrate();
    useDiscountsStore.persist.rehydrate();
    useAdminAuthStore.persist.rehydrate();
  }, []);

  return null;
}
