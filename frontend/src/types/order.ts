export interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
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
