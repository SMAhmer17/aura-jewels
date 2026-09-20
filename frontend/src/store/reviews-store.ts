import { create } from "zustand";
import type { Review } from "@/types/review";

interface ReviewsState {
  /** Published reviews per product id, loaded when a product page is opened. */
  byProduct: Record<string, Review[]>;
  setProductReviews: (productId: string, reviews: Review[]) => void;
}

export const useReviewsStore = create<ReviewsState>()((set) => ({
  byProduct: {},
  setProductReviews: (productId, reviews) => set((state) => ({ byProduct: { ...state.byProduct, [productId]: reviews } })),
}));
