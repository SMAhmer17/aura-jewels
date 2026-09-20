"use client";

import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useCatalogReady } from "@/lib/services/catalog-service";
import { CatalogLoading } from "@/components/ui/CatalogLoading";
import { useCartLines, useShippingCost, removeFromCart, updateCartQuantity } from "@/lib/services/cart-service";
import { ProductImage } from "@/components/features/product/ProductImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { formatPrice } from "@/lib/utils/currency";

export default function CartPage() {
  const lines = useCartLines();
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const shipping = useShippingCost(subtotal);
  const total = subtotal + shipping;
  const { ready, failed } = useCatalogReady();

  if (!ready) return <CatalogLoading failed={failed} />;

  if (lines.length === 0) {
    return (
      <EmptyState
        className="mx-auto my-16 max-w-lg"
        title="Your cart is empty"
        description="Explore the collection and add pieces you love."
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
      <h1 className="mb-8 text-3xl text-ink sm:text-4xl">Your Cart</h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col divide-y divide-border lg:col-span-2">
          {lines.map((line) => (
            <div key={`${line.productId}-${line.variantId}`} className="flex gap-4 py-6">
              <Link
                href={`/product/${line.product.slug}`}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-(--radius-md) border border-border"
              >
                <ProductImage id={line.product.id} images={line.product.images} alt={line.product.name} className="h-full w-full" />
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/product/${line.product.slug}`} className="text-base text-ink">
                      {line.product.name}
                    </Link>
                    <p className="text-xs text-muted">Size: {line.variant.size}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove item"
                    onClick={() => removeFromCart(line.productId, line.variantId)}
                    className="text-muted hover:text-error"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 rounded-(--radius-sm) border border-border px-2 py-1">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => updateCartQuantity(line.productId, line.variantId, line.quantity - 1)}
                      disabled={line.quantity <= 1}
                      className="text-ink disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-4 text-center text-sm text-ink">{line.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => updateCartQuantity(line.productId, line.variantId, line.quantity + 1)}
                      disabled={line.quantity >= line.variant.stock}
                      className="text-ink disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-sm text-ink">
                    {formatPrice(line.product.price * line.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex h-fit flex-col gap-4 rounded-(--radius-md) border border-border p-6">
          <h2 className="text-lg text-ink">Order Summary</h2>
          <div className="flex flex-col gap-2 text-sm text-muted">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-ink">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-ink">{formatPrice(shipping)}</span>
            </div>
          </div>
          <div className="flex justify-between border-t border-border pt-4 text-base text-ink">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <LinkButton href="/checkout" variant="primary" size="lg" className="mt-2 w-full">
            Proceed to Checkout
          </LinkButton>
          <LinkButton href="/shop" variant="link" size="sm" className="self-center">
            Continue Shopping
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
