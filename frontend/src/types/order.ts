export interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discountCode?: string;
  discountAmount: number;
  total: number;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  status: OrderStatus;
  createdAt: string;
}
