import { create } from "zustand";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";

/** Products with no category (their category was deleted) use this id on the client. The API stores null. */
export const UNCATEGORIZED_ID = "uncategorized";

interface CatalogState {
  /** False until the first load from the API finishes, so pages can show a skeleton instead of "not found". */
  ready: boolean;
  /** Set when the first load failed, so pages can offer a retry instead of looking empty. */
  loadFailed: boolean;
  categories: Category[];
  /** Active products only: what the public storefront sees (sold out ones included, filtered by services). */
  products: Product[];
  /** Every product including drafts and archived. Only loaded for the signed-in admin. */
  adminProducts: Product[];
  setCatalog: (categories: Category[], products: Product[]) => void;
  setCategories: (categories: Category[]) => void;
  setProducts: (products: Product[]) => void;
  setAdminProducts: (products: Product[]) => void;
  setLoadFailed: (failed: boolean) => void;
}

export const useCatalogStore = create<CatalogState>()((set) => ({
  ready: false,
  loadFailed: false,
  categories: [],
  products: [],
  adminProducts: [],
  setCatalog: (categories, products) => set({ categories, products, ready: true, loadFailed: false }),
  setCategories: (categories) => set({ categories }),
  setProducts: (products) => set({ products }),
  setAdminProducts: (adminProducts) => set({ adminProducts }),
  setLoadFailed: (loadFailed) => set({ loadFailed }),
}));
