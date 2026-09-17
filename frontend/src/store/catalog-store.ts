import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import { seedCategories } from "@/lib/mock-data/categories";
import { seedProducts } from "@/lib/mock-data/products";

export const UNCATEGORIZED_ID = "uncategorized";

interface CatalogState {
  categories: Category[];
  products: Product[];
  addCategory: (input: Omit<Category, "id" | "createdAt">) => void;
  updateCategory: (id: string, input: Partial<Omit<Category, "id" | "createdAt">>) => void;
  removeCategory: (id: string) => void;
  addProduct: (input: Omit<Product, "id" | "createdAt">) => void;
  updateProduct: (id: string, input: Partial<Omit<Product, "id" | "createdAt">>) => void;
  removeProduct: (id: string) => void;
}

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set) => ({
      categories: seedCategories,
      products: seedProducts,
      addCategory: (input) =>
        set((state) => ({
          categories: [
            ...state.categories,
            { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
          ],
        })),
      updateCategory: (id, input) =>
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id ? { ...category, ...input } : category,
          ),
        })),
      removeCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id),
          products: state.products.map((product) =>
            product.categoryId === id ? { ...product, categoryId: UNCATEGORIZED_ID } : product,
          ),
        })),
      addProduct: (input) =>
        set((state) => ({
          products: [
            ...state.products,
            { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
          ],
        })),
      updateProduct: (id, input) =>
        set((state) => ({
          products: state.products.map((product) =>
            product.id === id ? { ...product, ...input } : product,
          ),
        })),
      removeProduct: (id) =>
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
        })),
    }),
    { name: "aura-jewels-catalog", skipHydration: true },
  ),
);
