"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useAdminAuthStore } from "@/store/admin-auth-store";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { useCatalogStore } from "@/store/catalog-store";
import { loadCatalog } from "@/lib/services/catalog-service";
import { loadSettings } from "@/lib/services/settings-service";
import { loadHomeContent } from "@/lib/services/home-content-service";

/**
 * Runs once when the app opens:
 *  1. Restores what the browser keeps for this visitor (cart, wishlist, sign-in sessions). These stores
 *     use skipHydration so the server and first client render agree, then rehydrate here.
 *  2. Loads the shared shop data (catalog, settings, home page content) from the API.
 *  3. Drops cart and wishlist entries for products that no longer exist.
 */
export function StoreHydration() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
    useWishlistStore.persist.rehydrate();
    useAdminAuthStore.persist.rehydrate();
    useCustomerAuthStore.persist.rehydrate();

    void loadCatalog().then(() => {
      const { ready, products } = useCatalogStore.getState();
      if (!ready) return;
      useCartStore.getState().prune(new Set(products.flatMap((p) => p.variants.map((v) => v.id))));
      useWishlistStore.getState().prune(new Set(products.map((p) => p.id)));
    });
    void loadSettings().catch(() => undefined);
    void loadHomeContent().catch(() => undefined);
  }, []);

  return null;
}

/** Re-runs the catalog load after a failed first attempt. */
export function retryCatalog() {
  useCatalogStore.getState().setLoadFailed(false);
  void loadCatalog();
}
