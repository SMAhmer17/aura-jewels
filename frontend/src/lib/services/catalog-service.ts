import { useMemo } from "react";
import { useCatalogStore } from "@/store/catalog-store";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";

/**
 * Data-access layer for the catalog. Components call these — never the store
 * directly — so swapping to Supabase later only touches this file.
 */

export function useCategories(): Category[] {
  return useCatalogStore((state) => state.categories);
}

export function useCategoryBySlug(slug: string): Category | undefined {
  return useCatalogStore((state) => state.categories.find((category) => category.slug === slug));
}

export function useCategoryById(id: string): Category | undefined {
  return useCatalogStore((state) => state.categories.find((category) => category.id === id));
}

export function addCategory(input: Omit<Category, "id" | "createdAt">) {
  useCatalogStore.getState().addCategory(input);
}

export function updateCategory(id: string, input: Partial<Omit<Category, "id" | "createdAt">>) {
  useCatalogStore.getState().updateCategory(id, input);
}

export function removeCategory(id: string) {
  useCatalogStore.getState().removeCategory(id);
}

const isPubliclyVisible = (product: Product) => product.status === "active";

export function useProducts(): Product[] {
  const products = useAllProducts();
  return useMemo(() => products.filter(isPubliclyVisible), [products]);
}

export function useAllProducts(): Product[] {
  return useCatalogStore((state) => state.products);
}

export function useProductsByCategoryId(categoryId: string): Product[] {
  const products = useAllProducts();
  return useMemo(
    () => products.filter((product) => isPubliclyVisible(product) && product.categoryId === categoryId),
    [products, categoryId],
  );
}

export function useFeaturedProducts(): Product[] {
  const products = useAllProducts();
  return useMemo(
    () => products.filter((product) => isPubliclyVisible(product) && product.featured),
    [products],
  );
}

export function useProductBySlug(slug: string): Product | undefined {
  return useCatalogStore((state) => state.products.find((product) => product.slug === slug));
}

export function addProduct(input: Omit<Product, "id" | "createdAt">) {
  useCatalogStore.getState().addProduct(input);
}

export function updateProduct(id: string, input: Partial<Omit<Product, "id" | "createdAt">>) {
  useCatalogStore.getState().updateProduct(id, input);
}

export function removeProduct(id: string) {
  useCatalogStore.getState().removeProduct(id);
}
