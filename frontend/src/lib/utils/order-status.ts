import type { OrderStatus, PaymentStatus } from "@/types/order";

export const orderStatusOptions: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];
export const paymentStatusOptions: PaymentStatus[] = ["unpaid", "paid", "refunded"];

export const orderStatusVariant: Record<OrderStatus, "neutral" | "gold" | "success" | "error"> = {
  pending: "gold",
  processing: "gold",
  shipped: "neutral",
  delivered: "success",
  cancelled: "error",
};

export const paymentStatusVariant: Record<PaymentStatus, "neutral" | "gold" | "success" | "error"> = {
  unpaid: "gold",
  paid: "success",
  refunded: "neutral",
};

/** Cancelled orders never count towards revenue, sales, or customer spend. */
export const countsAsSale = (order: { status: OrderStatus }) => order.status !== "cancelled";
