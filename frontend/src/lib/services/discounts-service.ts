import { useDiscountsStore } from "@/store/discounts-store";
import type { Discount } from "@/types/discount";

export function useDiscounts(): Discount[] {
  return useDiscountsStore((state) => state.discounts);
}

export function findActiveDiscountByCode(code: string): Discount | undefined {
  const normalized = code.trim().toUpperCase();
  return useDiscountsStore
    .getState()
    .discounts.find(
      (d) =>
        d.code === normalized &&
        d.active &&
        (d.usageLimit === null || d.usedCount < d.usageLimit),
    );
}

export function calculateDiscountAmount(discount: Discount, subtotal: number): number {
  const amount = discount.type === "percentage" ? (subtotal * discount.value) / 100 : discount.value;
  return Math.min(amount, subtotal);
}

export function addDiscount(input: Omit<Discount, "id" | "createdAt" | "usedCount">) {
  useDiscountsStore.getState().addDiscount(input);
}

export function updateDiscount(id: string, input: Partial<Omit<Discount, "id" | "createdAt">>) {
  useDiscountsStore.getState().updateDiscount(id, input);
}

export function removeDiscount(id: string) {
  useDiscountsStore.getState().removeDiscount(id);
}

export function incrementDiscountUsage(id: string) {
  useDiscountsStore.getState().incrementUsage(id);
}
