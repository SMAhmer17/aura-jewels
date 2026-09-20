export interface OrderItem {
  /** Empty when the product has since been deleted; the name, size and price are kept on the order. */
  productId: string | null;
  variantId: string | null;
  name: string;
  size: string;
  price: number;
  quantity: number;
  /** Cover photo of the product when the order was placed. */
  image?: string;
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export interface OrderEvent {
  status: OrderStatus;
  at: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discountCode?: string;
  discountAmount: number;
  giftBoxFee?: number;
  total: number;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  notes?: string;
  timeline?: OrderEvent[];
  createdAt: string;
}

/** What anyone with an order number can see when tracking it. It never includes the customer's personal details. */
export interface TrackedOrder {
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  timeline: OrderEvent[];
  items: { name: string; size: string; quantity: number; price: number; image?: string | null }[];
  subtotal: number;
  shipping: number;
  discountAmount: number;
  giftBoxFee: number | null;
  total: number;
}
