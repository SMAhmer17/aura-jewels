import { useEffect } from "react";
import { useReviewsStore } from "@/store/reviews-store";
import { useCatalogStore } from "@/store/catalog-store";
import { api } from "@/lib/api/client";
import type { AdminReview, Review } from "@/types/review";

const NO_REVIEWS: Review[] = [];

async function loadProductReviews(productId: string, slug: string) {
  const reviews = await api<Review[]>(`/products/${slug}/reviews`);
  useReviewsStore.getState().setProductReviews(productId, reviews);
}

/** Published reviews for a product, newest first. Loaded from the API when the product is shown. */
export function useProductReviews(productId: string): Review[] {
  const reviews = useReviewsStore((state) => state.byProduct[productId]);

  useEffect(() => {
    const product = useCatalogStore.getState().products.find((p) => p.id === productId);
    if (product) void loadProductReviews(productId, product.slug).catch(() => undefined);
  }, [productId]);

  return reviews ?? NO_REVIEWS;
}

export interface NewReview {
  productId: string;
  author: string;
  email: string;
  rating: number;
  title?: string;
  comment: string;
}

/** Submits a review. The API checks it, marks real buyers as verified, and allows one review per email per product. */
export async function addReview(input: NewReview) {
  const product = useCatalogStore.getState().products.find((p) => p.id === input.productId);
  if (!product) throw new Error("Product not found");
  await api(`/products/${product.slug}/reviews`, {
    method: "POST",
    body: { author: input.author, email: input.email, rating: input.rating, title: input.title || undefined, comment: input.comment },
  });
  await loadProductReviews(input.productId, product.slug);
}

// ---------------- Admin ----------------

export async function loadAdminReviews(): Promise<void> {
  useReviewsStore.getState().setAdminReviews(await api<AdminReview[]>("/admin/reviews", { as: "admin" }));
}

export function useAdminReviews(): AdminReview[] {
  return useReviewsStore((state) => state.adminReviews);
}

export async function setReviewPublished(id: string, isPublished: boolean) {
  await api(`/admin/reviews/${id}`, { method: "PATCH", as: "admin", body: { isPublished } });
  await loadAdminReviews();
}

export async function removeReview(id: string) {
  await api(`/admin/reviews/${id}`, { method: "DELETE", as: "admin" });
  await loadAdminReviews();
}
