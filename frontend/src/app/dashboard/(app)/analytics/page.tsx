"use client";

import { useMemo } from "react";
import { useOrders } from "@/lib/services/orders-service";
import type { OrderStatus } from "@/types/order";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils/currency";

const statusColor: Record<OrderStatus, string> = {
  pending: "bg-gold",
  processing: "bg-gold",
  shipped: "bg-muted",
  delivered: "bg-success",
  cancelled: "bg-error",
};

export default function AnalyticsPage() {
  const orders = useOrders();

  const revenueByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of orders) {
      const day = new Date(order.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric" });
      map.set(day, (map.get(day) ?? 0) + order.total);
    }
    return Array.from(map.entries()).map(([day, revenue]) => ({ day, revenue }));
  }, [orders]);

  const topProducts = useMemo(() => {
    const qtyByProduct = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.items) {
        qtyByProduct.set(item.name, (qtyByProduct.get(item.name) ?? 0) + item.quantity);
      }
    }
    return Array.from(qtyByProduct.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);
  }, [orders]);

  const statusCounts = useMemo(() => {
    const counts: Record<OrderStatus, number> = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const order of orders) counts[order.status] += 1;
    return counts;
  }, [orders]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;
  const maxRevenue = Math.max(1, ...revenueByDay.map((d) => d.revenue));
  const maxQuantity = Math.max(1, ...topProducts.map((p) => p.quantity));
  const maxStatusCount = Math.max(1, ...Object.values(statusCounts));

  if (orders.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl text-ink sm:text-3xl">Analytics</h1>
        <EmptyState
          title="No data yet"
          description="Analytics will populate once orders start coming in."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl text-ink sm:text-3xl">Analytics</h1>
        <p className="text-sm text-muted">Performance at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">Total Revenue</span>
            <span className="text-2xl text-ink">{formatPrice(totalRevenue)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">Total Orders</span>
            <span className="text-2xl text-ink">{orders.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">Avg. Order Value</span>
            <span className="text-2xl text-ink">{formatPrice(Math.round(avgOrderValue))}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">Products Sold</span>
            <span className="text-2xl text-ink">
              {orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5">
          <h2 className="text-base text-ink">Revenue by Day</h2>
          <div className="flex h-48 items-end gap-3 border-b border-border pb-1">
            {revenueByDay.map(({ day, revenue }) => (
              <div key={day} className="flex flex-1 flex-col items-center gap-2" title={formatPrice(revenue)}>
                <span className="text-xs text-ink">{formatPrice(revenue)}</span>
                <div
                  className="w-full max-w-10 rounded-t-(--radius-sm) bg-gold"
                  style={{ height: `${Math.max(6, (revenue / maxRevenue) * 140)}px` }}
                />
                <span className="text-xs text-muted">{day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <h2 className="text-base text-ink">Top Products</h2>
            <div className="flex flex-col gap-3">
              {topProducts.map(({ name, quantity }) => (
                <div key={name} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink">{name}</span>
                    <span className="text-muted">{quantity} sold</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-cream">
                    <div
                      className="h-full rounded-full bg-ink"
                      style={{ width: `${(quantity / maxQuantity) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4">
            <h2 className="text-base text-ink">Orders by Status</h2>
            <div className="flex flex-col gap-3">
              {(Object.entries(statusCounts) as [OrderStatus, number][]).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-sm capitalize text-ink">{status}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream">
                    <div
                      className={`h-full rounded-full ${statusColor[status]}`}
                      style={{ width: `${(count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-sm text-muted">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
