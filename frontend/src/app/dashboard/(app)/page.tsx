"use client";

import Link from "next/link";
import { useAllProducts, useCategories } from "@/lib/services/catalog-service";
import { useOrders } from "@/lib/services/orders-service";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils/currency";

function StatCard({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <Card className="h-full">
      <CardContent className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
        <span className="text-2xl text-ink">{value}</span>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function DashboardOverviewPage() {
  const products = useAllProducts();
  const categories = useCategories();
  const orders = useOrders();

  const lowStockVariants = products.flatMap((p) =>
    p.variants.filter((v) => v.stock > 0 && v.stock <= 5).map((v) => ({ product: p, variant: v })),
  );
  const outOfStockCount = products.filter((p) => p.variants.every((v) => v.stock === 0)).length;
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl text-ink sm:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted">An overview of your store.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Products" value={String(products.length)} href="/dashboard/products" />
        <StatCard label="Categories" value={String(categories.length)} href="/dashboard/categories" />
        <StatCard label="Total Orders" value={String(orders.length)} href="/dashboard/orders" />
        <StatCard label="Revenue" value={formatPrice(revenue)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base text-ink">Low Stock</h2>
              <Link href="/dashboard/inventory" className="text-xs text-muted underline underline-offset-4">
                View Inventory
              </Link>
            </div>
            {lowStockVariants.length === 0 && outOfStockCount === 0 ? (
              <p className="text-sm text-muted">Everything is well stocked.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {outOfStockCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink">{outOfStockCount} product(s) sold out</span>
                    <Badge variant="error">Out of Stock</Badge>
                  </div>
                )}
                {lowStockVariants.slice(0, 5).map(({ product, variant }) => (
                  <div key={variant.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink">
                      {product.name} <span className="text-muted">({variant.size})</span>
                    </span>
                    <Badge variant="gold">{variant.stock} left</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base text-ink">Orders Needing Attention</h2>
              <Link href="/dashboard/orders" className="text-xs text-muted underline underline-offset-4">
                View Orders
              </Link>
            </div>
            {pendingOrders.length === 0 ? (
              <p className="text-sm text-muted">No pending orders.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink">
                      {order.orderNumber} <span className="text-muted">for {order.customerName}</span>
                    </span>
                    <span className="text-ink">{formatPrice(order.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
