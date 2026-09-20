export interface Review {
  id: string;
  productId: string;
  author: string;
  title?: string | null;
  rating: number;
  comment: string;
  /** True when the reviewer has a (non-cancelled) order containing this product. */
  verifiedBuyer?: boolean;
  createdAt: string;
}

/** A review as the dashboard sees it: with the private email and whether it is shown on the storefront. */
export interface AdminReview extends Review {
  email: string | null;
  isPublished: boolean;
  productName: string;
  productSlug: string;
}
