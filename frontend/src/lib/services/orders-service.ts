import { useOrdersStore } from "@/store/orders-store";
import { useCatalogStore } from "@/store/catalog-store";
import { clearCart } from "@/lib/services/cart-service";
import type { CartLine } from "@/lib/services/cart-service";
import { incrementDiscountUsage } from "@/lib/services/discounts-service";
import type { Discount } from "@/types/discount";
import type { Order, OrderStatus } from "@/types/order";

export interface ShippingDetails {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

function generateOrderNumber() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `AJ-${new Date().getFullYear()}-${random}`;
}

export function useOrders(): Order[] {
  return useOrdersStore((state) => state.orders);
}

export function useOrderById(id: string): Order | undefined {
  return useOrdersStore((state) => state.orders.find((order) => order.id === id));
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  useOrdersStore.getState().updateStatus(id, status);
}

/** Places an order from the current cart lines: records the order, decrements stock, and clears the cart. */
export function placeOrder(
  shipping: ShippingDetails,
  lines: CartLine[],
  shippingCost: number,
  appliedDiscount?: { discount: Discount; amount: number },
): Order {
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const discountAmount = appliedDiscount?.amount ?? 0;

  const order: Order = {
    id: crypto.randomUUID(),
    orderNumber: generateOrderNumber(),
    items: lines.map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      name: line.product.name,
      size: line.variant.size,
      price: line.product.price,
      quantity: line.quantity,
    })),
    subtotal,
    shipping: shippingCost,
    discountCode: appliedDiscount?.discount.code,
    discountAmount,
    total: Math.max(0, subtotal + shippingCost - discountAmount),
    ...shipping,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  useOrdersStore.getState().addOrder(order);
  if (appliedDiscount) incrementDiscountUsage(appliedDiscount.discount.id);

  const catalog = useCatalogStore.getState();
  for (const line of lines) {
    const product = catalog.products.find((p) => p.id === line.productId);
    if (!product) continue;
    catalog.updateProduct(product.id, {
      variants: product.variants.map((v) =>
        v.id === line.variantId ? { ...v, stock: Math.max(0, v.stock - line.quantity) } : v,
      ),
    });
  }

  clearCart();

  return order;
}
