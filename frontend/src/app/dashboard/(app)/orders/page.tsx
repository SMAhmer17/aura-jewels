"use client";

import { useOrders, updateOrderStatus } from "@/lib/services/orders-service";
import type { OrderStatus } from "@/types/order";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils/currency";

const statusOptions: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];

const statusVariant: Record<OrderStatus, "neutral" | "gold" | "success" | "error"> = {
  pending: "gold",
  processing: "gold",
  shipped: "neutral",
  delivered: "success",
  cancelled: "error",
};

export default function OrdersPage() {
  const orders = useOrders();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink sm:text-3xl">Orders</h1>
        <p className="text-sm text-muted">{orders.length} total orders</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Orders placed at checkout will show up here."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Order</TableHeaderCell>
              <TableHeaderCell>Customer</TableHeaderCell>
              <TableHeaderCell>Items</TableHeaderCell>
              <TableHeaderCell>Total</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{order.orderNumber}</span>
                    <span className="text-xs text-muted">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{order.customerName}</span>
                    <span className="text-xs text-muted">{order.email}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted">
                  {order.items.reduce((sum, i) => sum + i.quantity, 0)} item(s)
                </TableCell>
                <TableCell>{formatPrice(order.total)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[order.status]} className="capitalize">
                      {order.status}
                    </Badge>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className="h-8 rounded-(--radius-sm) border border-border bg-surface px-2 text-xs text-ink focus:border-gold focus:outline-none"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
