export interface ProductVariant {
  id: string;
  size: string;
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  /** Image sources. The first image is the cover (thumbnail) shown on cards and lists. */
  images?: string[];
  material: string;
  variants: ProductVariant[];
  status: "active" | "draft" | "archived";
  featured?: boolean;
  createdAt: string;
}
