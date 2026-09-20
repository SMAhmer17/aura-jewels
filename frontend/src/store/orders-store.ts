import { create } from "zustand";
import type { Order } from "@/types/order";

interface OrdersState {
  /** Every order, for the signed-in admin. Empty until the dashboard loads them. */
  orders: Order[];
  loaded: boolean;
  setOrders: (orders: Order[]) => void;
  upsertOrder: (order: Order) => void;
}

export const useOrdersStore = create<OrdersState>()((set) => ({
  orders: [],
  loaded: false,
  setOrders: (orders) => set({ orders, loaded: true }),
  upsertOrder: (order) =>
    set((state) =>
      state.orders.some((o) => o.id === order.id)
        ? { orders: state.orders.map((o) => (o.id === order.id ? order : o)) }
        : { orders: [order, ...state.orders] },
    ),
}));
