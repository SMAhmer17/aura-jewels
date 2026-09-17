"use client";

import { useParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useOrderById } from "@/lib/services/orders-service";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { formatPrice } from "@/lib/utils/currency";

export default function OrderConfirmationPage() {
  const params = useParams<{ id: string }>();
  const order = useOrderById(params.id);

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
            <div key={`${item.productId}-${item.variantId}`} className="flex justify-between pt-3 first:pt-0 text-sm">
              <span className="text-ink">
                {item.name} <span className="text-muted">({item.size}) &times; {item.quantity}</span>
              </span>
              <span className="text-ink">{formatPrice(item.price * item.quantity)}</span>
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
        </div>
      </div>

      <LinkButton href="/shop" variant="primary" size="md" className="mt-8">
        Continue Shopping
      </LinkButton>
    </div>
  );
}
