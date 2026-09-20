import { create } from "zustand";
import type { Discount } from "@/types/discount";

interface DiscountsState {
  discounts: Discount[];
  loaded: boolean;
  setDiscounts: (discounts: Discount[]) => void;
}

export const useDiscountsStore = create<DiscountsState>()((set) => ({
  discounts: [],
  loaded: false,
  setDiscounts: (discounts) => set({ discounts, loaded: true }),
}));
