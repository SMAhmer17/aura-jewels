export type DiscountType = "percentage" | "fixed";

export interface Discount {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  active: boolean;
  usageLimit: number | null;
  usedCount: number;
  createdAt: string;
}
