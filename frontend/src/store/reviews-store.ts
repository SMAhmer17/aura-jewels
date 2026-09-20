import { create } from "zustand";
import type { AdminReview, Review } from "@/types/review";

interface ReviewsState {
  /** Published reviews per product id, loaded when a product page is opened. */
  byProduct: Record<string, Review[]>;
  /** Every review (hidden ones too) for the signed-in admin. */
  adminReviews: AdminReview[];
  setProductReviews: (productId: string, reviews: Review[]) => void;
  setAdminReviews: (reviews: AdminReview[]) => void;
}

export const useReviewsStore = create<ReviewsState>()((set) => ({
  byProduct: {},
  adminReviews: [],
  setProductReviews: (productId, reviews) => set((state) => ({ byProduct: { ...state.byProduct, [productId]: reviews } })),
  setAdminReviews: (adminReviews) => set({ adminReviews }),
}));
