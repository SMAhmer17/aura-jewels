"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCartLines, useShippingCost } from "@/lib/services/cart-service";
import { placeOrder } from "@/lib/services/orders-service";
import { findActiveDiscountByCode, calculateDiscountAmount } from "@/lib/services/discounts-service";
import type { Discount } from "@/types/discount";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { formatPrice } from "@/lib/utils/currency";
import { toast } from "@/store/toast-store";

export default function CheckoutPage() {
  const router = useRouter();
  const lines = useCartLines();
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const shipping = useShippingCost(subtotal);

  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);

  const discountAmount = appliedDiscount ? calculateDiscountAmount(appliedDiscount, subtotal) : 0;
  const total = Math.max(0, subtotal + shipping - discountAmount);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleApplyPromo() {
    const discount = findActiveDiscountByCode(promoInput);
    if (!discount) {
      toast({ title: "Invalid or expired code", variant: "error" });
      return;
    }
    setAppliedDiscount(discount);
    toast({ title: "Promo code applied", description: discount.code, variant: "success" });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const order = placeOrder(
      form,
      lines,
      shipping,
      appliedDiscount ? { discount: appliedDiscount, amount: discountAmount } : undefined,
    );
    router.push(`/order-confirmation/${order.id}`);
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        className="mx-auto my-16 max-w-lg"
        title="Your cart is empty"
        description="Add something to your cart before checking out."
        action={
          <LinkButton href="/shop" variant="primary" size="md">
            Continue Shopping
          </LinkButton>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl text-ink sm:text-4xl">Checkout</h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 lg:col-span-2">
          <h2 className="text-lg text-ink">Shipping Details</h2>
          <Input
            label="Full Name"
            required
            value={form.customerName}
            onChange={update("customerName")}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input label="Email" type="email" required value={form.email} onChange={update("email")} />
            <Input label="Phone" type="tel" required value={form.phone} onChange={update("phone")} />
          </div>
          <Input label="Address" required value={form.address} onChange={update("address")} />
          <Input label="City" required value={form.city} onChange={update("city")} />

          <div className="mt-2 rounded-(--radius-md) border border-dashed border-border p-4 text-xs text-muted">
            Payment collection isn&apos;t enabled yet, so placing this order will not charge you.
            This is a demo checkout flow.
          </div>

          <Button type="submit" variant="primary" size="lg" disabled={submitting} className="mt-2">
            {submitting ? "Placing Order..." : `Place Order (${formatPrice(total)})`}
          </Button>
        </form>

        <div className="flex h-fit flex-col gap-4 rounded-(--radius-md) border border-border p-6">
          <h2 className="text-lg text-ink">Order Summary</h2>
          <div className="flex flex-col gap-3 divide-y divide-border">
            {lines.map((line) => (
              <div key={`${line.productId}-${line.variantId}`} className="flex justify-between gap-3 pt-3 first:pt-0 text-sm">
                <span className="text-ink">
                  {line.product.name}{" "}
                  <span className="text-muted">
                    ({line.variant.size}) &times; {line.quantity}
                  </span>
                </span>
                <span className="shrink-0 text-ink">{formatPrice(line.product.price * line.quantity)}</span>
              </div>
            ))}
          </div>

          {appliedDiscount ? (
            <div className="flex items-center justify-between rounded-(--radius-sm) bg-gold/10 px-3 py-2 text-sm">
              <span className="text-ink">Code {appliedDiscount.code} applied</span>
              <button
                type="button"
                onClick={() => {
                  setAppliedDiscount(null);
                  setPromoInput("");
                }}
                className="text-xs text-muted underline underline-offset-4"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Promo code"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                className="h-10"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleApplyPromo}>
                Apply
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm text-muted">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-ink">{formatPrice(subtotal)}</span>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="text-ink">&minus;{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-ink">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
          </div>
          <div className="flex justify-between border-t border-border pt-4 text-base text-ink">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
