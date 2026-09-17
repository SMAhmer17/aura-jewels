import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order, OrderStatus } from "@/types/order";

interface OrdersState {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateStatus: (id: string, status: OrderStatus) => void;
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      updateStatus: (id, status) =>
        set((state) => ({
          orders: state.orders.map((order) => (order.id === id ? { ...order, status } : order)),
        })),
    }),
    { name: "aura-jewels-orders", skipHydration: true },
  ),
);
