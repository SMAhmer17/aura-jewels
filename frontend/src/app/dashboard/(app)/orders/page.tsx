"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useOrders, updateOrderStatus } from "@/lib/services/orders-service";
import type { OrderStatus, PaymentStatus } from "@/types/order";
import { orderStatusOptions, orderStatusVariant, paymentStatusOptions, paymentStatusVariant } from "@/lib/utils/order-status";
import { RANGE_OPTIONS, inRange, type RangeId } from "@/lib/utils/date-range";
import { FilterPills, FilterSelect, ResultsBar, SearchField } from "@/components/features/dashboard/DashboardFilters";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils/currency";
import { toast } from "@/store/toast-store";
import { errorMessage } from "@/lib/api/client";

export default function OrdersPage() {
  const orders = useOrders();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "all">("all");
  const [range, setRange] = useState<RangeId>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (paymentFilter !== "all" && (o.paymentStatus ?? "unpaid") !== paymentFilter) return false;
      if (!inRange(o.createdAt, range)) return false;
      if (!term) return true;
      return `${o.orderNumber} ${o.customerName} ${o.email} ${o.phone}`.toLowerCase().includes(term);
    });
    return list.sort((a, b) => {
      if (sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
      if (sort === "highest") return b.total - a.total;
      if (sort === "lowest") return a.total - b.total;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [orders, query, statusFilter, paymentFilter, range, sort]);

  const filtersActive = query !== "" || statusFilter !== "all" || paymentFilter !== "all" || range !== "all";
  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setRange("all");
  }

  async function handleStatusChange(id: string, status: OrderStatus) {
    try {
      const result = await updateOrderStatus(id, status);
      if (result === "restocked") toast({ title: "Order cancelled", description: "Items were returned to stock.", variant: "success" });
      else if (result === "deducted") toast({ title: "Order reopened", description: "Items were taken out of stock again." });
    } catch (error) {
      toast({ title: "Could not update the order", description: errorMessage(error), variant: "error" });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink sm:text-3xl">Orders</h1>
        <p className="text-sm text-muted">{orders.length} total orders. Cancelling an order returns its items to stock.</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders yet" description="Orders placed at checkout will show up here." />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            <FilterPills
              label="Order status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={(["all", ...orderStatusOptions] as const).map((id) => ({ id, label: `${id === "all" ? "All" : id.charAt(0).toUpperCase() + id.slice(1)} (${counts[id] ?? 0})` }))}
            />
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <SearchField value={query} onChange={setQuery} placeholder="Search order, name, email, phone" label="Search orders" className="lg:w-80" />
              <FilterSelect label="Date" value={range} onChange={setRange} options={RANGE_OPTIONS} />
              <FilterSelect
                label="Payment"
                value={paymentFilter}
                onChange={setPaymentFilter}
                options={[{ id: "all", label: "All" }, ...paymentStatusOptions.map((id) => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) }))]}
              />
              <FilterSelect
                label="Sort"
                value={sort}
                onChange={setSort}
                options={[
                  { id: "newest", label: "Newest first" },
                  { id: "oldest", label: "Oldest first" },
                  { id: "highest", label: "Highest total" },
                  { id: "lowest", label: "Lowest total" },
                ]}
              />
            </div>
            <ResultsBar shown={filtered.length} total={orders.length} active={filtersActive} onClear={clearFilters} />
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No matching orders" description="Try a different status or search term." />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Order</TableHeaderCell>
                  <TableHeaderCell>Customer</TableHeaderCell>
                  <TableHeaderCell>Items</TableHeaderCell>
                  <TableHeaderCell>Total</TableHeaderCell>
                  <TableHeaderCell>Payment</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={`/dashboard/orders/${order.id}`} className="flex flex-col hover:text-gold">
                        <span className="underline underline-offset-4">{order.orderNumber}</span>
                        <span className="text-xs text-muted">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{order.customerName}</span>
                        <span className="text-xs text-muted">{order.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted">{order.items.reduce((sum, i) => sum + i.quantity, 0)} item(s)</TableCell>
                    <TableCell>{formatPrice(order.total)}</TableCell>
                    <TableCell>
                      <Badge variant={paymentStatusVariant[order.paymentStatus ?? "unpaid"]} className="capitalize">
                        {order.paymentStatus ?? "unpaid"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={orderStatusVariant[order.status]} className="capitalize">
                          {order.status}
                        </Badge>
                        <select
                          value={order.status}
                          aria-label={`Change status for ${order.orderNumber}`}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className="h-8 rounded-(--radius-sm) border border-border bg-surface px-2 text-xs text-ink focus:border-gold focus:outline-none"
                        >
                          {orderStatusOptions.map((status) => (
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
        </>
      )}
    </div>
  );
}
