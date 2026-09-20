"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, PackageSearch } from "lucide-react";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { customerLogout } from "@/lib/services/auth-service";
import { fetchMyOrders } from "@/lib/services/orders-service";
import { errorMessage } from "@/lib/api/client";
import { AccountPanel } from "@/components/layout/AccountDrawer";
import { OrderItemImage } from "@/components/features/order/OrderItemImage";
import { Badge } from "@/components/ui/Badge";
import { BrandLoader } from "@/components/ui/PageSkeletons";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { formatPrice } from "@/lib/utils/currency";
import { orderStatusVariant } from "@/lib/utils/order-status";
import { toast } from "@/store/toast-store";
import type { Order } from "@/types/order";

const BENEFITS = [
  { title: "Your order history", text: "Everything you have bought from us, in one place, whenever you want to look back." },
  { title: "Follow active orders", text: "See exactly where each order is, from placed to delivered." },
  { title: "Faster checkout", text: "Your name, email and phone are filled in for you every time." },
];

const isActive = (o: Order) => o.status === "pending" || o.status === "processing" || o.status === "shipped";

function OrderCard({ order }: { order: Order }) {
  return (
    <div className="flex flex-col gap-4 rounded-(--radius-md) border border-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base text-ink">{order.orderNumber}</p>
          <p className="text-xs text-muted">Placed {new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        <Badge variant={orderStatusVariant[order.status]} className="capitalize">
          {order.status}
        </Badge>
      </div>
      <div className="flex flex-col gap-3">
        {order.items.map((item, i) => (
          <div key={`${item.variantId}-${i}`} className="flex items-center gap-3 text-sm">
            <OrderItemImage item={item} />
            <span className="text-ink">
              {item.name} <span className="text-muted">({item.size}) &times; {item.quantity}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-sm text-ink">{formatPrice(order.total)} <span className="text-xs text-muted">cash on delivery</span></span>
        <div className="flex gap-2">
          <LinkButton href={`/track-order?order=${encodeURIComponent(order.orderNumber)}`} variant="outline" size="sm">
            Track order
          </LinkButton>
          <LinkButton href={`/order-confirmation/${order.id}`} variant="ghost" size="sm">
            View details
          </LinkButton>
        </div>
      </div>
    </div>
  );
}

function MyOrders() {
  const customer = useCustomerAuthStore((s) => s.customer);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchMyOrders()
      .then((list) => !cancelled && setOrders(list))
      .catch((e) => !cancelled && setError(errorMessage(e, "We could not load your orders. Please try again.")));
    return () => {
      cancelled = true;
    };
  }, []);

  const active = orders?.filter(isActive) ?? [];
  const past = orders?.filter((o) => !isActive(o)) ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">My Account</p>
          <h1 className="mt-2 text-3xl text-ink sm:text-4xl">Welcome, {customer?.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted">{customer?.email}</p>
        </div>
        <Button
          variant="outline"
          size="md"
          onClick={() => {
            customerLogout();
            toast({ title: "Signed out" });
          }}
        >
          Sign Out
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-(--radius-md) border border-error/30 bg-error/10 p-4 text-sm text-error">
          {error}
        </p>
      )}
      {!orders && !error && <BrandLoader label="Loading your orders" />}

      {orders && orders.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-(--radius-md) border border-dashed border-border p-10 text-center">
          <PackageSearch size={28} className="text-gold" />
          <h2 className="text-xl text-ink">No orders yet</h2>
          <p className="max-w-sm text-sm text-muted">Orders you place while signed in show up here, so you can follow them and look back on what you have bought.</p>
          <LinkButton href="/shop" variant="primary" size="md">
            Start Shopping
          </LinkButton>
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-10 flex flex-col gap-4" aria-labelledby="active-orders">
          <h2 id="active-orders" className="text-xl text-ink">Active orders</h2>
          {active.map((order) => <OrderCard key={order.id} order={order} />)}
        </section>
      )}

      {past.length > 0 && (
        <section className="flex flex-col gap-4" aria-labelledby="past-orders">
          <h2 id="past-orders" className="text-xl text-ink">Order history</h2>
          {past.map((order) => <OrderCard key={order.id} order={order} />)}
        </section>
      )}

      <p className="mt-12 text-center text-xs text-muted">
        Need help with an order?{" "}
        <Link href="/contact" className="text-ink underline underline-offset-4">Contact us</Link>. Orders placed before you signed in are not listed here, but you can always{" "}
        <Link href="/track-order" className="text-ink underline underline-offset-4">track them by order number</Link>.
      </p>
    </div>
  );
}

function SignedOut() {
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">My Account</p>
          <h1 className="mt-2 text-3xl text-ink sm:text-4xl">Keep track of everything you buy</h1>
          <p className="mt-3 text-sm text-muted">
            Create a free account and every order you place while signed in is saved, so you always know what you bought and where your active orders are.
          </p>
        </div>
        <ul className="flex flex-col gap-4">
          {BENEFITS.map((b) => (
            <li key={b.title} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                <Check size={14} />
              </span>
              <div>
                <p className="text-sm text-ink">{b.title}</p>
                <p className="text-xs text-muted">{b.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="rounded-(--radius-md) bg-cream p-4 text-xs text-muted">
          An account is optional. If you check out as a guest, you can still follow your order any time with its order number on the{" "}
          <Link href="/track-order" className="text-ink underline underline-offset-4">Track Order</Link> page.
        </p>
      </div>
      <div className="rounded-(--radius-md) border border-border bg-surface">
        <AccountPanel onClose={() => undefined} />
      </div>
    </div>
  );
}

export default function AccountPage() {
  const signedIn = useCustomerAuthStore((s) => s.isAuthenticated);
  // The saved sign-in is restored after the page first paints, so wait for that before choosing what to show.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    useCustomerAuthStore.persist.rehydrate();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, []);
  if (!ready) return null;
  return signedIn ? <MyOrders /> : <SignedOut />;
}
