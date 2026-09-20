"use client";

import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { trackOrder } from "@/lib/services/orders-service";
import { errorMessage } from "@/lib/api/client";
import { OrderTimeline } from "@/components/features/order/OrderTimeline";
import { OrderItemImage } from "@/components/features/order/OrderItemImage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LinkButton } from "@/components/ui/LinkButton";
import { formatPrice } from "@/lib/utils/currency";
import { orderStatusVariant } from "@/lib/utils/order-status";
import type { TrackedOrder } from "@/types/order";

function TrackOrder() {
  const params = useSearchParams();
  const initial = params.get("order") ?? "";
  const [number, setNumber] = useState(initial);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async (value: string) => {
    if (!value.trim()) return;
    setLoading(true);
    setError("");
    try {
      setOrder(await trackOrder(value));
    } catch (e) {
      setOrder(null);
      setError(errorMessage(e, "We could not check that right now. Please try again."));
    } finally {
      setLoading(false);
    }
  }, []);

  // A link from the confirmation page or an account opens with the number already looked up.
  useEffect(() => {
    // Loading data on arrival is the purpose of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initial) void lookup(initial);
  }, [initial, lookup]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void lookup(number);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <p className="text-xs uppercase tracking-widest text-gold">Order Tracking</p>
        <h1 className="mt-2 text-3xl text-ink sm:text-4xl">Track your order</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          Enter the order number from your confirmation, for example AJ-2026-1001, to see where your order is right now.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input label="Order number" placeholder="e.g. AJ-2026-1001" value={number} onChange={(e) => setNumber(e.target.value)} required autoComplete="off" />
        </div>
        <Button type="submit" variant="primary" size="md" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Checking..." : "Track Order"}
        </Button>
      </form>

      {error && (
        <p role="alert" className="mx-auto mt-6 max-w-lg rounded-(--radius-md) border border-error/30 bg-error/10 p-4 text-center text-sm text-error">
          {error}
        </p>
      )}

      {order && (
        <div className="mt-12 flex flex-col gap-8">
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-(--radius-md) border border-border p-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted">Order</p>
              <p className="text-2xl text-ink">{order.orderNumber}</p>
              <p className="text-sm text-muted">Placed {new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={orderStatusVariant[order.status]} className="capitalize">
                {order.status}
              </Badge>
              <span className="text-xs text-muted">
                {order.paymentStatus === "paid" ? "Cash on delivery, payment received" : order.paymentStatus === "refunded" ? "Payment refunded" : "Cash on delivery, pay when it arrives"}
              </span>
            </div>
          </div>

          <div className="rounded-(--radius-md) border border-border p-6">
            <h2 className="mb-6 text-lg text-ink">Order status</h2>
            <OrderTimeline status={order.status} timeline={order.timeline} />
          </div>

          <div className="flex flex-col gap-4 rounded-(--radius-md) border border-border p-6">
            <h2 className="text-lg text-ink">What you ordered</h2>
            <div className="flex flex-col divide-y divide-border">
              {order.items.map((item, i) => (
                <div key={`${item.name}-${item.size}-${i}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 text-sm">
                  <div className="flex items-center gap-3">
                    <OrderItemImage item={{ productId: null, name: item.name, image: item.image ?? undefined }} className="h-14 w-14" />
                    <span className="text-ink">
                      {item.name} <span className="text-muted">({item.size}) &times; {item.quantity}</span>
                    </span>
                  </div>
                  <span className="shrink-0 text-ink">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm text-muted">
              <div className="flex justify-between"><span>Subtotal</span><span className="text-ink">{formatPrice(order.subtotal)}</span></div>
              {order.discountAmount > 0 && <div className="flex justify-between"><span>Discount</span><span className="text-ink">&minus;{formatPrice(order.discountAmount)}</span></div>}
              {order.giftBoxFee ? <div className="flex justify-between"><span>Gift box</span><span className="text-ink">{formatPrice(order.giftBoxFee)}</span></div> : null}
              <div className="flex justify-between"><span>Shipping</span><span className="text-ink">{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span></div>
              <div className="flex justify-between border-t border-border pt-3 text-base text-ink"><span>Total to pay on delivery</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-(--radius-md) bg-cream p-6 text-center">
            <p className="text-sm text-ink">Questions about this order?</p>
            <p className="text-xs text-muted">Send us a message and quote your order number. We will get back to you.</p>
            <LinkButton href={`/contact?order=${encodeURIComponent(order.orderNumber)}`} variant="outline" size="md">
              Contact us about this order
            </LinkButton>
          </div>
        </div>
      )}

      {!order && !error && !loading && (
        <div className="mx-auto mt-14 flex max-w-lg flex-col items-center gap-3 text-center text-sm text-muted">
          <PackageSearch size={28} className="text-gold" />
          <p>
            Your order number is on your confirmation page. Have an account?{" "}
            <Link href="/account" className="text-ink underline underline-offset-4">
              Sign in to see all your orders
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={null}>
      <TrackOrder />
    </Suspense>
  );
}
