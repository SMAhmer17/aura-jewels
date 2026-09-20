import { useMemo } from "react";
import { useCatalogStore } from "@/store/catalog-store";
import { api } from "@/lib/api/client";
import { categoryIdForApi, toCategory, toProduct } from "@/lib/api/mappers";
import type { Category } from "@/types/category";
import type { Product, ProductVariant } from "@/types/product";

/**
 * Data-access layer for the catalog. Components call these, never the store or fetch directly.
 * Reads come from an in-memory copy of what the API returned; writes go to the API first and
 * then refresh that copy, so the screen always shows what the server actually saved.
 */

// ---------------- Loading ----------------

/** Loads the public catalog (categories and active products). Safe to call again to refresh. */
export async function loadCatalog(): Promise<void> {
  const store = useCatalogStore.getState();
  try {
    const [categories, products] = await Promise.all([
      api<Parameters<typeof toCategory>[0][]>("/categories"),
      api<Parameters<typeof toProduct>[0][]>("/products"),
    ]);
    store.setCatalog(categories.map(toCategory), products.map(toProduct));
  } catch {
    // Keep whatever we already had; only flag a failure if nothing has ever loaded.
    if (!useCatalogStore.getState().ready) store.setLoadFailed(true);
  }
}

/** Loads every product (drafts and archived too) for the dashboard. */
export async function loadAdminProducts(): Promise<void> {
  const products = await api<Parameters<typeof toProduct>[0][]>("/admin/products", { as: "admin" });
  useCatalogStore.getState().setAdminProducts(products.map(toProduct));
}

async function refreshCategories() {
  const categories = await api<Parameters<typeof toCategory>[0][]>("/categories");
  useCatalogStore.getState().setCategories(categories.map(toCategory));
}

/** After an admin change, refresh both the dashboard list and the storefront list. */
async function refreshProducts() {
  await Promise.all([loadAdminProducts(), loadCatalog()]);
}

// ---------------- Categories ----------------

export function useCategories(): Category[] {
  return useCatalogStore((state) => state.categories);
}

export function useCategoryBySlug(slug: string): Category | undefined {
  return useCatalogStore((state) => state.categories.find((category) => category.slug === slug));
}

export function useCategoryById(id: string): Category | undefined {
  return useCatalogStore((state) => state.categories.find((category) => category.id === id));
}

/** True once the first catalog load has finished, so pages can show a skeleton instead of "not found". */
export function useCatalogReady(): { ready: boolean; failed: boolean } {
  const ready = useCatalogStore((state) => state.ready);
  const failed = useCatalogStore((state) => state.loadFailed);
  return { ready, failed };
}

export async function addCategory(input: Omit<Category, "id" | "createdAt">) {
  await api("/admin/categories", {
    method: "POST",
    as: "admin",
    body: { name: input.name, slug: input.slug || undefined, description: input.description || null },
  });
  await refreshCategories();
}

export async function updateCategory(id: string, input: Partial<Omit<Category, "id" | "createdAt">>) {
  await api(`/admin/categories/${id}`, {
    method: "PATCH",
    as: "admin",
    body: {
      name: input.name,
      slug: input.slug || undefined,
      description: input.description !== undefined ? input.description || null : undefined,
    },
  });
  await refreshCategories();
}

export async function removeCategory(id: string) {
  await api(`/admin/categories/${id}`, { method: "DELETE", as: "admin" });
  // Its products stay, but now have no category.
  await Promise.all([refreshCategories(), refreshProducts()]);
}

// ---------------- Products ----------------

const isActive = (product: Product) => product.status === "active";

/** A product is sold out once every size/variant has zero stock. */
export function isSoldOut(product: Product): boolean {
  return product.variants.every((v) => v.stock <= 0);
}

const isBuyable = (product: Product) => isActive(product) && !isSoldOut(product);

/** The storefront's products: active only (sold out ones included; the lists below split them). */
function usePublicProducts(): Product[] {
  return useCatalogStore((state) => state.products);
}

/** Every product including drafts and archived, for dashboard screens. */
export function useAllProducts(): Product[] {
  return useCatalogStore((state) => state.adminProducts);
}

/** Products customers can buy: active and in stock. Sold out items are excluded from every storefront list. */
export function useProducts(): Product[] {
  const products = usePublicProducts();
  return useMemo(() => products.filter(isBuyable), [products]);
}

/** Active products that have sold out, for the "Sold" showcase sections. */
export function useSoldOutProducts(): Product[] {
  const products = usePublicProducts();
  return useMemo(() => products.filter((p) => isActive(p) && isSoldOut(p)), [products]);
}

export function useProductsByCategoryId(categoryId: string): Product[] {
  const products = usePublicProducts();
  return useMemo(
    () => products.filter((product) => isBuyable(product) && product.categoryId === categoryId),
    [products, categoryId],
  );
}

export function useFeaturedProducts(): Product[] {
  const products = usePublicProducts();
  return useMemo(() => products.filter((product) => isBuyable(product) && product.featured), [products]);
}

export function useProductBySlug(slug: string): Product | undefined {
  return useCatalogStore((state) => state.products.find((product) => product.slug === slug));
}

type ProductInput = Omit<Product, "id" | "createdAt">;

function variantsForApi(variants: ProductVariant[], existingIds: Set<string>) {
  // New rows get a temporary client id in the form; only real ids the server knows are sent.
  return variants.map((v) => ({
    id: existingIds.has(v.id) ? v.id : undefined,
    size: v.size,
    stock: v.stock,
    sku: v.sku || undefined,
  }));
}

export async function addProduct(input: ProductInput) {
  await api("/admin/products", {
    method: "POST",
    as: "admin",
    body: {
      name: input.name,
      slug: input.slug || undefined,
      description: input.description,
      price: input.price,
      compareAtPrice: input.compareAtPrice ?? null,
      categoryId: categoryIdForApi(input.categoryId),
      material: input.material,
      images: input.images ?? [],
      status: input.status,
      featured: !!input.featured,
      variants: variantsForApi(input.variants, new Set()),
    },
  });
  await refreshProducts();
}

export async function updateProduct(id: string, patch: Partial<ProductInput>) {
  const existing = useCatalogStore.getState().adminProducts.find((p) => p.id === id);
  const existingIds = new Set(existing?.variants.map((v) => v.id) ?? []);
  await api(`/admin/products/${id}`, {
    method: "PATCH",
    as: "admin",
    body: {
      name: patch.name,
      slug: patch.slug || undefined,
      description: patch.description,
      price: patch.price,
      // Clearing the sale price must send null; an omitted key would leave it unchanged.
      compareAtPrice: "compareAtPrice" in patch ? (patch.compareAtPrice ?? null) : undefined,
      categoryId: "categoryId" in patch ? categoryIdForApi(patch.categoryId) : undefined,
      material: patch.material,
      images: patch.images,
      status: patch.status,
      featured: patch.featured,
      variants: patch.variants ? variantsForApi(patch.variants, existingIds) : undefined,
    },
  });
  await refreshProducts();
}

export async function removeProduct(id: string) {
  await api(`/admin/products/${id}`, { method: "DELETE", as: "admin" });
  await refreshProducts();
}

function patchStock(products: Product[], variantId: string, stock: number): Product[] {
  return products.map((p) =>
    p.variants.some((v) => v.id === variantId)
      ? { ...p, variants: p.variants.map((v) => (v.id === variantId ? { ...v, stock } : v)) }
      : p,
  );
}

// Saves for the same size run one after another, so quick +/- clicks can't land out of order.
const stockQueue = new Map<string, Promise<unknown>>();

/**
 * Sets a size's stock. The screen updates immediately so +/- buttons feel instant, then the API
 * is asked to save it; if that fails the dashboard list is reloaded so it shows the truth.
 */
export async function setVariantStock(_productId: string, variantId: string, stock: number) {
  const next = Math.max(0, Math.floor(stock) || 0);
  const store = useCatalogStore.getState();
  store.setAdminProducts(patchStock(store.adminProducts, variantId, next));
  const save = (stockQueue.get(variantId) ?? Promise.resolve()).catch(() => undefined).then(async () => {
    try {
      await api(`/admin/variants/${variantId}/stock`, { method: "PATCH", as: "admin", body: { stock: next } });
      const current = useCatalogStore.getState();
      current.setProducts(patchStock(current.products, variantId, next));
    } catch (error) {
      await loadAdminProducts().catch(() => undefined);
      throw error;
    }
  });
  stockQueue.set(variantId, save);
  return save;
}
