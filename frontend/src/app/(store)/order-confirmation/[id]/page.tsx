"use client";

import { useParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useOrderById } from "@/lib/services/orders-service";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { openAccountDrawer } from "@/store/ui-store";
import { OrderItemImage } from "@/components/features/order/OrderItemImage";
import { LinkButton } from "@/components/ui/LinkButton";
import { formatPrice } from "@/lib/utils/currency";

export default function OrderConfirmationPage() {
  const params = useParams<{ id: string }>();
  const { order, loading } = useOrderById(params.id);
  const signedIn = useCustomerAuthStore((s) => s.isAuthenticated);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center text-sm text-muted" role="status">
        Loading your order...
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState
        className="mx-auto my-16 max-w-lg"
        title="We couldn't find that order"
        description="The order may no longer exist."
        action={
          <LinkButton href="/" variant="outline" size="md">
            Return Home
          </LinkButton>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-gold text-gold">
        <CheckCircle2 size={26} />
      </span>
      <p className="text-xs uppercase tracking-widest text-gold">Order Confirmed</p>
      <h1 className="mt-2 text-3xl text-ink sm:text-4xl">Thank you, {order.customerName.split(" ")[0]}</h1>
      <p className="mt-3 text-sm text-muted">
        Your order <span className="text-ink">{order.orderNumber}</span> has been received and is
        being prepared.
      </p>

      <div className="mt-10 flex flex-col gap-4 rounded-(--radius-md) border border-border p-6 text-left">
        <div className="flex flex-col gap-3 divide-y divide-border">
          {order.items.map((item) => (
            <div key={`${item.variantId}-${item.size}`} className="flex items-center justify-between gap-3 pt-3 first:pt-0 text-sm">
              <div className="flex items-center gap-3">
                <OrderItemImage item={item} />
                <span className="text-ink">
                  {item.name} <span className="text-muted">({item.size}) &times; {item.quantity}</span>
                </span>
              </div>
              <span className="shrink-0 text-ink">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm text-muted">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-ink">{formatPrice(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between">
              <span>Discount {order.discountCode && `(${order.discountCode})`}</span>
              <span className="text-ink">&minus;{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          {order.giftBoxFee ? (
            <div className="flex justify-between">
              <span>Gift box</span>
              <span className="text-ink">{formatPrice(order.giftBoxFee)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="text-ink">{formatPrice(order.shipping)}</span>
          </div>
        </div>
        <div className="flex justify-between border-t border-border pt-4 text-base text-ink">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
        <div className="border-t border-border pt-4 text-sm text-muted">
          <p className="text-ink">Shipping to:</p>
          <p>{order.address}, {order.city}</p>
          <p className="mt-3 text-ink">Payment:</p>
          <p>Cash on delivery. You pay when your order arrives.</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 rounded-(--radius-md) bg-cream p-6 text-left text-sm">
        <p className="text-ink">Follow your order</p>
        <p className="text-xs text-muted">
          Keep your order number <span className="text-ink">{order.orderNumber}</span>. Enter it on the Track Order page any time to see where your order is, or contact us about it.
        </p>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={`/track-order?order=${encodeURIComponent(order.orderNumber)}`} variant="outline" size="sm">
            Track this order
          </LinkButton>
          <LinkButton href={`/contact?order=${encodeURIComponent(order.orderNumber)}`} variant="ghost" size="sm">
            Contact us about it
          </LinkButton>
        </div>
        {!signedIn && (
          <p className="border-t border-ink/10 pt-3 text-xs text-muted">
            Next time, create a free account before you order and we will keep your full order history and active orders for you.{" "}
            <button type="button" onClick={openAccountDrawer} className="text-ink underline underline-offset-4">
              Create an account
            </button>
          </p>
        )}
      </div>

      <LinkButton href="/shop" variant="primary" size="md" className="mt-8">
        Continue Shopping
      </LinkButton>
    </div>
  );
}
