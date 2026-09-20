"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCartLines, useShippingCost } from "@/lib/services/cart-service";
import { placeOrder } from "@/lib/services/orders-service";
import { validateDiscountCode, type AppliedDiscount } from "@/lib/services/discounts-service";
import { useCatalogReady } from "@/lib/services/catalog-service";
import { errorMessage } from "@/lib/api/client";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { openAccountDrawer } from "@/store/ui-store";
import { CatalogLoading } from "@/components/ui/CatalogLoading";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { formatPrice } from "@/lib/utils/currency";
import { toast } from "@/store/toast-store";
import { useSettings } from "@/lib/services/settings-service";

/**
 * Promo codes are switched off for now: the box is hidden and no code is ever sent with an order.
 * Set this to true to bring it back. The API, the Discounts dashboard page and the code below still work.
 */
const PROMO_CODES_ENABLED = false;

export default function CheckoutPage() {
  const router = useRouter();
  const lines = useCartLines();
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const shipping = useShippingCost(subtotal);
  const { giftBoxPrice } = useSettings();
  const [giftBox, setGiftBox] = useState(false);
  const giftBoxFee = giftBox ? giftBoxPrice ?? 0 : 0;

  const account = useCustomerAuthStore((s) => s.customer);
  const signedIn = useCustomerAuthStore((s) => s.isAuthenticated);
  const { ready, failed } = useCatalogReady();
  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);

  // Signed-in customers start with their account details filled in (only into fields still empty).
  useEffect(() => {
    if (!account) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((prev) => ({
      ...prev,
      customerName: prev.customerName || account.name,
      email: prev.email || account.email,
      phone: prev.phone || (account.phone ?? ""),
    }));
  }, [account]);

  const unavailable = lines.filter((line) => line.quantity > line.variant.stock);
  const discountAmount = appliedDiscount ? Math.min(appliedDiscount.amount, subtotal) : 0;
  const total = Math.max(0, subtotal + shipping + giftBoxFee - discountAmount);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleApplyPromo() {
    setCheckingPromo(true);
    const result = await validateDiscountCode(promoInput, subtotal);
    setCheckingPromo(false);
    if (!result.discount) {
      toast({ title: "Code not applied", description: result.error, variant: "error" });
      return;
    }
    setAppliedDiscount(result.discount);
    toast({ title: "Promo code applied", description: result.discount.code, variant: "success" });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (unavailable.length > 0 || submitting) return;
    setSubmitting(true);
    try {
      const order = await placeOrder(form, lines, { discountCode: PROMO_CODES_ENABLED ? appliedDiscount?.code : undefined, giftBox });
      router.push(`/order-confirmation/${order.id}`);
    } catch (error) {
      // Covers a size selling out mid-checkout or a promo code that stopped working; the message is written for customers.
      toast({ title: "We couldn't place your order", description: errorMessage(error), variant: "error" });
      setSubmitting(false);
    }
  }

  if (!ready) return <CatalogLoading failed={failed} />;

  // After a successful order the cart empties, so keep showing the spinner state instead of "cart is empty" while navigating.
  if (lines.length === 0 && !submitting) {
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
          {signedIn ? (
            <p className="rounded-(--radius-md) bg-cream p-4 text-xs text-muted">
              Signed in as {account?.email}. This order will be saved to your account so you can follow it any time.
            </p>
          ) : (
            <p className="rounded-(--radius-md) bg-cream p-4 text-xs text-muted">
              Checking out as a guest is fine. Want your orders saved so you can see your history and follow active orders?{" "}
              <button type="button" onClick={openAccountDrawer} className="text-ink underline underline-offset-4">
                Sign in or create an account
              </button>{" "}
              before you place this order.
            </p>
          )}
          <h2 className="text-lg text-ink">Shipping Details</h2>
          <Input
            label="Full Name" placeholder="Enter your full name"
            required
            value={form.customerName}
            onChange={update("customerName")}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input label="Email" placeholder="Enter your email address" type="email" required value={form.email} onChange={update("email")} />
            <Input label="Phone" placeholder="e.g. 0300 1234567" type="tel" required value={form.phone} onChange={update("phone")} />
          </div>
          <Input label="Address" placeholder="House number, street and area" required value={form.address} onChange={update("address")} />
          <Input label="City" placeholder="Enter your city" required value={form.city} onChange={update("city")} />

          <label className="flex cursor-pointer items-start gap-3 rounded-(--radius-md) border border-border p-4">
            <input
              type="checkbox"
              checked={giftBox}
              onChange={(e) => setGiftBox(e.target.checked)}
              className="mt-1 h-4 w-4 accent-gold"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm text-ink">Add a gift box ({formatPrice(giftBoxPrice ?? 0)})</span>
              <span className="text-xs text-muted">Your order arrives in a jewellery box, ready to give.</span>
            </span>
          </label>

          <div className="mt-2 rounded-(--radius-md) border border-dashed border-border p-4 text-xs text-muted">
            Payment is cash on delivery. You pay when your order arrives, and nothing is charged online.
          </div>

          {unavailable.length > 0 && (
            <div role="alert" className="rounded-(--radius-md) border border-error/30 bg-error/10 p-4 text-sm text-error">
              Some items are no longer available in the quantity you chose:{" "}
              {unavailable.map((l) => `${l.product.name} (${l.variant.size}, ${l.variant.stock} left)`).join(", ")}.
              Please update your cart.
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" disabled={submitting || unavailable.length > 0} className="mt-2">
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

          {PROMO_CODES_ENABLED && (appliedDiscount ? (
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
              <Button type="button" variant="outline" size="sm" onClick={handleApplyPromo} disabled={checkingPromo || !promoInput.trim()}>
                {checkingPromo ? "Checking" : "Apply"}
              </Button>
            </div>
          ))}

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
            {giftBox && (
              <div className="flex justify-between">
                <span>Gift box</span>
                <span className="text-ink">{formatPrice(giftBoxFee)}</span>
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
