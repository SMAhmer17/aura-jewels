/** Public order number, e.g. AJ-2026-1001. Built from the sequential orderNo and the year placed. */
export function formatOrderNumber(orderNo: number, createdAt: Date): string {
  return `AJ-${createdAt.getFullYear()}-${1000 + orderNo}`;
}
