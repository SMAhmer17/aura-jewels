export type DiscountType = "percentage" | "fixed";

export interface Discount {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  active: boolean;
  usageLimit: number | null;
  /** Optional date range (YYYY-MM-DD) in which the code works. */
  startsAt?: string | null;
  endsAt?: string | null;
  minOrderAmount?: number | null;
  usedCount: number;
  createdAt: string;
}
