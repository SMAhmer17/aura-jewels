import { useDiscountsStore } from "@/store/discounts-store";
import { api, ApiError } from "@/lib/api/client";
import { toDiscount } from "@/lib/api/mappers";
import type { Discount } from "@/types/discount";

type RawDiscount = Parameters<typeof toDiscount>[0];

export async function loadDiscounts(): Promise<void> {
  const rows = await api<RawDiscount[]>("/admin/discounts", { as: "admin" });
  useDiscountsStore.getState().setDiscounts(rows.map(toDiscount));
}

export function useDiscounts(): Discount[] {
  return useDiscountsStore((state) => state.discounts);
}

export type DiscountState = "active" | "inactive" | "scheduled" | "expired" | "used up";

export function getDiscountState(d: Discount): DiscountState {
  if (!d.active) return "inactive";
  const now = new Date().getTime();
  if (d.startsAt && now < new Date(`${d.startsAt}T00:00:00`).getTime()) return "scheduled";
  if (d.endsAt && now > new Date(`${d.endsAt}T23:59:59`).getTime()) return "expired";
  if (d.usageLimit !== null && d.usedCount >= d.usageLimit) return "used up";
  return "active";
}

export interface AppliedDiscount {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  /** What the code takes off the current subtotal. The server recalculates this when the order is placed. */
  amount: number;
}

export type DiscountCheck = { discount: AppliedDiscount; error?: undefined } | { discount?: undefined; error: string };

/** Asks the API whether a promo code works for this subtotal, with a customer-friendly reason when it does not. */
export async function validateDiscountCode(code: string, subtotal: number): Promise<DiscountCheck> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { error: "Enter a promo code." };
  try {
    const res = await api<{ valid: boolean; error?: string } & Partial<AppliedDiscount>>("/discounts/validate", {
      method: "POST",
      body: { code: normalized, subtotal },
    });
    if (!res.valid || !res.code) return { error: res.error ?? "This code is not valid." };
    return { discount: { code: res.code, type: res.type!, value: res.value!, amount: res.amount ?? 0 } };
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Could not check this code. Try again." };
  }
}

type DiscountInput = Omit<Discount, "id" | "createdAt" | "usedCount">;

function bodyFor(input: Partial<DiscountInput>) {
  return {
    code: input.code,
    type: input.type,
    value: input.value,
    active: input.active,
    usageLimit: input.usageLimit,
    minOrderAmount: input.minOrderAmount,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  };
}

export async function addDiscount(input: DiscountInput) {
  await api("/admin/discounts", { method: "POST", as: "admin", body: bodyFor(input) });
  await loadDiscounts();
}

export async function updateDiscount(id: string, input: Partial<Omit<Discount, "id" | "createdAt">>) {
  await api(`/admin/discounts/${id}`, { method: "PATCH", as: "admin", body: bodyFor(input) });
  await loadDiscounts();
}

export async function removeDiscount(id: string) {
  await api(`/admin/discounts/${id}`, { method: "DELETE", as: "admin" });
  await loadDiscounts();
}
