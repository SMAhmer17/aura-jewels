import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Discount } from "@/types/discount";
import { seedDiscounts } from "@/lib/mock-data/discounts";

interface DiscountsState {
  discounts: Discount[];
  addDiscount: (input: Omit<Discount, "id" | "createdAt" | "usedCount">) => void;
  updateDiscount: (id: string, input: Partial<Omit<Discount, "id" | "createdAt">>) => void;
  removeDiscount: (id: string) => void;
  incrementUsage: (id: string) => void;
}

export const useDiscountsStore = create<DiscountsState>()(
  persist(
    (set) => ({
      discounts: seedDiscounts,
      addDiscount: (input) =>
        set((state) => ({
          discounts: [
            ...state.discounts,
            { ...input, id: crypto.randomUUID(), usedCount: 0, createdAt: new Date().toISOString() },
          ],
        })),
      updateDiscount: (id, input) =>
        set((state) => ({
          discounts: state.discounts.map((d) => (d.id === id ? { ...d, ...input } : d)),
        })),
      removeDiscount: (id) =>
        set((state) => ({ discounts: state.discounts.filter((d) => d.id !== id) })),
      incrementUsage: (id) =>
        set((state) => ({
          discounts: state.discounts.map((d) => (d.id === id ? { ...d, usedCount: d.usedCount + 1 } : d)),
        })),
    }),
    { name: "aura-jewels-discounts", skipHydration: true },
  ),
);
