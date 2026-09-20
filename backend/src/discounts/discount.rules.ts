import type { Discount } from '@prisma/client';

const today = (now: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(now); // YYYY-MM-DD
const day = (d: Date) => d.toISOString().slice(0, 10);

export type DiscountState = 'active' | 'inactive' | 'scheduled' | 'expired' | 'used up';

export function discountState(d: Discount, now = new Date()): DiscountState {
  if (!d.active) return 'inactive';
  const t = today(now);
  if (d.startsAt && t < day(d.startsAt)) return 'scheduled';
  if (d.endsAt && t > day(d.endsAt)) return 'expired';
  if (d.usageLimit !== null && d.usedCount >= d.usageLimit) return 'used up';
  return 'active';
}

/** A customer-friendly reason the code cannot be used, or null when it can. */
export function discountError(d: Discount | null | undefined, subtotal: number, now = new Date()): string | null {
  if (!d || !d.active) return 'This code is not valid.';
  const state = discountState(d, now);
  if (state === 'scheduled') return 'This code is not active yet.';
  if (state === 'expired') return 'This code has expired.';
  if (state === 'used up') return 'This code has reached its usage limit.';
  if (d.minOrderAmount && subtotal < d.minOrderAmount) {
    return `Spend at least Rs. ${d.minOrderAmount.toLocaleString('en-PK')} to use this code.`;
  }
  return null;
}

export function discountAmount(d: Discount, subtotal: number): number {
  const raw = d.type === 'percentage' ? Math.floor((subtotal * d.value) / 100) : d.value;
  return Math.min(raw, subtotal);
}
