import type { Discount } from "../../types/discount";
import type { ContactMessage } from "../../types/message";
import type { Order } from "../../types/order";
import type { Product } from "../../types/product";
import type { AdminReview } from "../../types/review";
import { formatPrice } from "./currency";

/**
 * Turns the store's current numbers into a short list of plain sentences for the dashboard overview:
 * what needs the owner's attention, and where things stand. Pure function, so it is easy to test.
 */

export type SummaryTone = "action" | "info" | "ok";

export interface SummaryItem {
  id: string;
  tone: SummaryTone;
  text: string;
  /** Dashboard page where the owner can act on it. */
  href?: string;
}

export interface SummaryInput {
  orders: Order[];
  products: Product[];
  discounts: Discount[];
  messages?: ContactMessage[];
  reviews?: AdminReview[];
  lowStockThreshold: number;
  now?: Date;
}

const TIME_ZONE = "Asia/Karachi";
const EXPIRY_WARNING_DAYS = 7;

/** The calendar day (YYYY-MM-DD) in Pakistan, so "today" matches the owner's day. */
const dayOf = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);

const daysBetween = (fromDay: string, toDay: string) =>
  Math.round((Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / 86_400_000);

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const are = (n: number) => (n === 1 ? "is" : "are");

function agoText(days: number) {
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export function buildSummary({ orders, products, discounts, messages = [], reviews = [], lowStockThreshold, now = new Date() }: SummaryInput): SummaryItem[] {
  const today = dayOf(now);
  const items: SummaryItem[] = [];

  // ---- Orders ----
  const pending = orders.filter((o) => o.status === "pending");
  if (pending.length > 0) {
    const oldest = pending.reduce((a, b) => (a.createdAt < b.createdAt ? a : b));
    items.push({
      id: "pending",
      tone: "action",
      text: `${plural(pending.length, "new order")} ${are(pending.length)} waiting to be confirmed. The oldest was placed ${agoText(daysBetween(dayOf(new Date(oldest.createdAt)), today))}.`,
      href: "/dashboard/orders",
    });
  }

  const processing = orders.filter((o) => o.status === "processing");
  if (processing.length > 0) {
    items.push({
      id: "processing",
      tone: "action",
      text: `${plural(processing.length, "order")} ${are(processing.length)} being prepared. Mark ${processing.length === 1 ? "it" : "them"} as shipped once ${processing.length === 1 ? "it goes" : "they go"} out.`,
      href: "/dashboard/orders",
    });
  }

  const unpaidDelivered = orders.filter((o) => o.status === "delivered" && (o.paymentStatus ?? "unpaid") === "unpaid");
  if (unpaidDelivered.length > 0) {
    const owed = unpaidDelivered.reduce((sum, o) => sum + o.total, 0);
    items.push({
      id: "unpaid",
      tone: "action",
      text: `${plural(unpaidDelivered.length, "delivered order")} ${are(unpaidDelivered.length)} still marked unpaid (${formatPrice(owed)} in cash to collect). Mark ${unpaidDelivered.length === 1 ? "it" : "them"} as paid once the money is received.`,
      href: "/dashboard/orders",
    });
  }

  // ---- Customer care ----
  const unread = messages.filter((m) => m.status === "unread");
  if (unread.length > 0) {
    items.push({
      id: "messages",
      tone: "action",
      text: `${plural(unread.length, "customer message")} ${are(unread.length)} waiting for a reply. Reply by email or phone, then mark ${unread.length === 1 ? "it" : "them"} resolved.`,
      href: "/dashboard/messages",
    });
  }

  const dayAgo = (iso: string) => daysBetween(dayOf(new Date(iso)), today);
  const lowReviews = reviews.filter((r) => r.isPublished && r.rating <= 2 && dayAgo(r.createdAt) <= 14);
  if (lowReviews.length > 0) {
    items.push({
      id: "low-reviews",
      tone: "action",
      text: `${plural(lowReviews.length, "recent review")} ${lowReviews.length === 1 ? "has" : "have"} 1 or 2 stars and ${are(lowReviews.length)} visible on the shop. Take a look, then reach out to the customer or hide ${lowReviews.length === 1 ? "it" : "them"}.`,
      href: "/dashboard/reviews",
    });
  }

  // ---- Stock ----
  const active = products.filter((p) => p.status === "active");
  const soldOut = active.filter((p) => p.variants.every((v) => v.stock <= 0));
  if (soldOut.length > 0) {
    items.push({
      id: "sold-out",
      tone: "action",
      text: `${plural(soldOut.length, "product")} ${soldOut.length === 1 ? "has" : "have"} sold out and ${are(soldOut.length)} hidden from the shop (${soldOut.length === 1 ? "it shows" : "they show"} in the Sold section). Restock ${soldOut.length === 1 ? "it" : "them"} when more arrives.`,
      href: "/dashboard/inventory",
    });
  }

  const lowProducts = active.filter((p) => p.variants.some((v) => v.stock > 0 && v.stock <= lowStockThreshold));
  if (lowProducts.length > 0) {
    const lowSizes = lowProducts.reduce((n, p) => n + p.variants.filter((v) => v.stock > 0 && v.stock <= lowStockThreshold).length, 0);
    items.push({
      id: "low-stock",
      tone: "action",
      text: `${plural(lowSizes, "size")} across ${plural(lowProducts.length, "product")} ${are(lowSizes)} running low (${lowStockThreshold} or fewer left).`,
      href: "/dashboard/inventory",
    });
  }

  // ---- Discounts ----
  for (const d of discounts) {
    if (!d.active) continue;
    if (d.usageLimit !== null && d.usedCount >= d.usageLimit) {
      items.push({ id: `used-${d.id}`, tone: "action", text: `Promo code ${d.code} has been used the maximum number of times.`, href: "/dashboard/discounts" });
    } else if (d.endsAt) {
      const left = daysBetween(today, d.endsAt);
      if (left < 0) {
        items.push({ id: `expired-${d.id}`, tone: "action", text: `Promo code ${d.code} ended ${agoText(-left)} but is still switched on. Customers can no longer use it.`, href: "/dashboard/discounts" });
      } else if (left <= EXPIRY_WARNING_DAYS) {
        const when = left === 0 ? "ends today" : left === 1 ? "ends tomorrow" : `ends in ${left} days`;
        items.push({ id: `ending-${d.id}`, tone: "action", text: `Promo code ${d.code} ${when}.`, href: "/dashboard/discounts" });
      }
    }
  }

  // ---- Status (nothing to do, just where things stand) ----
  const shipped = orders.filter((o) => o.status === "shipped");
  if (shipped.length > 0) {
    items.push({ id: "shipped", tone: "info", text: `${plural(shipped.length, "order")} ${are(shipped.length)} on the way to ${shipped.length === 1 ? "the customer" : "customers"}.`, href: "/dashboard/orders" });
  }

  const drafts = products.filter((p) => p.status === "draft");
  if (drafts.length > 0) {
    items.push({ id: "drafts", tone: "info", text: `${plural(drafts.length, "product")} ${are(drafts.length)} saved as ${drafts.length === 1 ? "a draft" : "drafts"} and not visible in the shop yet.`, href: "/dashboard/products" });
  }

  const newReviews = reviews.filter((r) => dayAgo(r.createdAt) <= 7);
  if (newReviews.length > 0) {
    items.push({ id: "new-reviews", tone: "info", text: `${plural(newReviews.length, "new review")} in the last 7 days.`, href: "/dashboard/reviews" });
  }

  const todays = orders.filter((o) => o.status !== "cancelled" && dayOf(new Date(o.createdAt)) === today);
  const todaysSales = todays.reduce((sum, o) => sum + o.total, 0);
  items.push({
    id: "today",
    tone: "info",
    text: todays.length === 0 ? "No orders have come in yet today." : `Today so far: ${plural(todays.length, "order")} and ${formatPrice(todaysSales)} in sales.`,
    href: "/dashboard/orders",
  });

  if (!items.some((i) => i.tone === "action")) {
    items.unshift({ id: "caught-up", tone: "ok", text: "You are all caught up. No orders are waiting and stock looks healthy." });
  }

  return items;
}
