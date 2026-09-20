"use client";

import Link from "next/link";
import { useAllProducts, useCategories } from "@/lib/services/catalog-service";
import { useOrders } from "@/lib/services/orders-service";
import { useDiscounts } from "@/lib/services/discounts-service";
import { useMessages } from "@/lib/services/messages-service";
import { useAdminReviews } from "@/lib/services/reviews-service";
import { useSettings } from "@/lib/services/settings-service";
import { countsAsSale } from "@/lib/utils/order-status";
import { buildSummary, type SummaryItem, type SummaryTone } from "@/lib/utils/dashboard-summary";
import { cn } from "@/lib/utils/cn";
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

const dotClass: Record<SummaryTone, string> = {
  action: "bg-gold",
  info: "bg-muted",
  ok: "bg-success",
};

function SummaryList({ items }: { items: SummaryItem[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const text = <span className="text-sm leading-relaxed text-ink">{item.text}</span>;
        return (
          <li key={item.id} className="flex items-start gap-3">
            <span aria-hidden className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", dotClass[item.tone])} />
            {item.href ? (
              <Link href={item.href} className="underline-offset-4 hover:underline">
                {text}
              </Link>
            ) : (
              text
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function DashboardOverviewPage() {
  const products = useAllProducts();
  const categories = useCategories();
  const orders = useOrders();
  const discounts = useDiscounts();
  const messages = useMessages();
  const reviews = useAdminReviews();
  const { lowStockThreshold } = useSettings();
  const threshold = lowStockThreshold ?? 5;

  const summary = buildSummary({ orders, products, discounts, messages, reviews, lowStockThreshold: threshold });
  const needsAttention = summary.filter((i) => i.tone !== "info");
  const status = summary.filter((i) => i.tone === "info");
  const actionCount = summary.filter((i) => i.tone === "action").length;

  const lowStockVariants = products.flatMap((p) =>
    p.variants.filter((v) => v.stock > 0 && v.stock <= threshold).map((v) => ({ product: p, variant: v })),
  );
  const outOfStockCount = products.filter((p) => p.variants.every((v) => v.stock === 0)).length;
  const revenue = orders.filter(countsAsSale).reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl text-ink sm:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted">An overview of your store.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg text-ink">Store Summary</h2>
            <Badge variant={actionCount > 0 ? "gold" : "success"}>
              {actionCount > 0 ? `${actionCount} to do` : "All clear"}
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <h3 className="font-body text-xs font-medium uppercase tracking-wide text-muted">Needs your attention</h3>
              <SummaryList items={needsAttention} />
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="font-body text-xs font-medium uppercase tracking-wide text-muted">Current status</h3>
              <SummaryList items={status} />
            </div>
          </div>
        </CardContent>
      </Card>

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
