import { useEffect } from "react";
import { useReviewsStore } from "@/store/reviews-store";
import { useCatalogStore } from "@/store/catalog-store";
import { api } from "@/lib/api/client";
import type { Review } from "@/types/review";

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

export async function addReview(input: Omit<Review, "id" | "createdAt">) {
  const product = useCatalogStore.getState().products.find((p) => p.id === input.productId);
  if (!product) throw new Error("Product not found");
  await api(`/products/${product.slug}/reviews`, {
    method: "POST",
    body: { author: input.author, rating: input.rating, comment: input.comment },
  });
  await loadProductReviews(input.productId, product.slug);
}
