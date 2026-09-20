import { useEffect, useState } from "react";
import { useOrdersStore } from "@/store/orders-store";
import { clearCart } from "@/lib/services/cart-service";
import type { CartLine } from "@/lib/services/cart-service";
import { loadCatalog, loadAdminProducts } from "@/lib/services/catalog-service";
import { loadDiscounts } from "@/lib/services/discounts-service";
import { api, ApiError } from "@/lib/api/client";
import { toOrder } from "@/lib/api/mappers";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

export interface ShippingDetails {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

type RawOrder = Parameters<typeof toOrder>[0];

// ---------------- Admin ----------------

const PAGE_SIZE = 200;

/** Loads every order for the dashboard (newest first), following pages until none are left. */
export async function loadOrders(): Promise<void> {
  const all: Order[] = [];
  for (let page = 1; ; page++) {
    const res = await api<{ data: RawOrder[]; total: number }>("/admin/orders", {
      as: "admin",
      query: { page, pageSize: PAGE_SIZE, sort: "newest" },
    });
    all.push(...res.data.map(toOrder));
    if (all.length >= res.total || res.data.length === 0) break;
  }
  useOrdersStore.getState().setOrders(all);
}

export function useOrders(): Order[] {
  return useOrdersStore((state) => state.orders);
}

export type OrderLookup = { order: Order | undefined; loading: boolean };

function useOrderLookup(id: string, fetcher: () => Promise<Order>, cached: Order | undefined): OrderLookup {
  const [state, setState] = useState<{ id: string; order?: Order; done: boolean }>({ id, done: false });

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((order) => !cancelled && setState({ id, order, done: true }))
      .catch(() => !cancelled && setState({ id, done: true }));
    return () => {
      cancelled = true;
    };
    // The fetcher is recreated every render; the order id is the only real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetched = state.id === id ? state : undefined;
  const order = cached ?? fetched?.order;
  return { order, loading: !order && !fetched?.done };
}

/** One order for the dashboard detail page. Uses the loaded list when it has it, otherwise asks the API. */
export function useAdminOrder(id: string): OrderLookup {
  const cached = useOrdersStore((state) => state.orders.find((o) => o.id === id));
  return useOrderLookup(id, async () => {
    const order = toOrder(await api<RawOrder>(`/admin/orders/${id}`, { as: "admin" }));
    useOrdersStore.getState().upsertOrder(order);
    return order;
  }, cached);
}

/** Changes an order's status; the server keeps stock honest (cancelling restocks, reopening deducts) and says which. */
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<"restocked" | "deducted" | null> {
  const before = useOrdersStore.getState().orders.find((o) => o.id === id);
  if (before?.status === status) return null;

  const updated = toOrder(await api<RawOrder>(`/admin/orders/${id}/status`, { method: "PATCH", as: "admin", body: { status } }));
  useOrdersStore.getState().upsertOrder(updated);
  // Stock may have changed, so refresh the product lists too.
  await Promise.all([loadAdminProducts(), loadCatalog(), loadDiscounts()]).catch(() => undefined);

  if (status === "cancelled") return "restocked";
  if (before?.status === "cancelled") return "deducted";
  return null;
}

export async function updateOrderDetails(id: string, patch: { paymentStatus?: PaymentStatus; notes?: string }) {
  const updated = toOrder(await api<RawOrder>(`/admin/orders/${id}`, { method: "PATCH", as: "admin", body: patch }));
  useOrdersStore.getState().upsertOrder(updated);
}

// ---------------- Storefront ----------------

/** The order confirmation page. The order id is an unguessable link, so guests can open it without an account. */
export function useOrderById(id: string): OrderLookup {
  return useOrderLookup(id, async () => toOrder(await api<RawOrder>(`/orders/${id}`)), undefined);
}

/** The signed-in customer's own orders (empty for guests). */
export async function fetchMyOrders(): Promise<Order[]> {
  const orders = await api<RawOrder[]>("/me/orders", { as: "customer" });
  return orders.map(toOrder);
}

export interface PlacedOrder {
  id: string;
  orderNumber: string;
  total: number;
}

/**
 * Places a cash-on-delivery order. Only WHAT is wanted is sent (sizes and quantities, plus a promo
 * code and gift box choice); the server works out prices, shipping, discount, and stock. If a size
 * sold out in the meantime the server refuses, and the catalog is refreshed so the cart is accurate.
 */
export async function placeOrder(
  shipping: ShippingDetails,
  lines: CartLine[],
  options: { discountCode?: string; giftBox?: boolean } = {},
): Promise<PlacedOrder> {
  try {
    const placed = await api<PlacedOrder>("/orders", {
      method: "POST",
      as: useCustomerAuthStore.getState().token ? "customer" : "public",
      body: {
        customer: {
          name: shipping.customerName,
          email: shipping.email,
          phone: shipping.phone,
          address: shipping.address,
          city: shipping.city,
        },
        items: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
        discountCode: options.discountCode || undefined,
        giftBox: options.giftBox || undefined,
      },
    });
    clearCart();
    // Stock changed, so refresh what the storefront shows.
    void loadCatalog();
    return placed;
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) void loadCatalog();
    throw error;
  }
}
