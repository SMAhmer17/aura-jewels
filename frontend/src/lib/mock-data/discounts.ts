import type { Discount } from "@/types/discount";

export const seedDiscounts: Discount[] = [
  {
    id: "disc-welcome10",
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    active: true,
    usageLimit: null,
    usedCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "disc-flat500",
    code: "FLAT500",
    type: "fixed",
    value: 500,
    active: true,
    usageLimit: 100,
    usedCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];
