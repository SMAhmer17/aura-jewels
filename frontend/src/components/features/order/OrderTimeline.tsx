import { Check, XCircle } from "lucide-react";
import type { OrderEvent, OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils/cn";

const STEPS: { status: Exclude<OrderStatus, "cancelled">; label: string; hint: string }[] = [
  { status: "pending", label: "Order placed", hint: "We have your order and will confirm it shortly." },
  { status: "processing", label: "Being prepared", hint: "Your jewellery is being checked and packed." },
  { status: "shipped", label: "On the way", hint: "Your order has left us and is heading to you." },
  { status: "delivered", label: "Delivered", hint: "Your order has arrived. Pay the rider on delivery." },
];

const order = STEPS.map((s) => s.status);

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

/** Where an order is, step by step. Shows when each step happened and what the next one is. */
export function OrderTimeline({ status, timeline }: { status: OrderStatus; timeline: OrderEvent[] }) {
  if (status === "cancelled") {
    const cancelledAt = [...timeline].reverse().find((e) => e.status === "cancelled")?.at;
    return (
      <div role="status" className="flex items-start gap-3 rounded-(--radius-md) border border-error/30 bg-error/10 p-4 text-sm">
        <XCircle size={20} className="mt-0.5 shrink-0 text-error" />
        <div>
          <p className="text-ink">This order was cancelled{cancelledAt ? ` on ${when(cancelledAt)}` : ""}.</p>
          <p className="mt-1 text-muted">If you did not ask for this, please contact us and we will help.</p>
        </div>
      </div>
    );
  }

  const current = order.indexOf(status);
  // The latest time each step was reached, from the order's history.
  const reached = new Map<string, string>();
  for (const event of timeline) reached.set(event.status, event.at);

  return (
    <ol className="flex flex-col">
      {STEPS.map((step, i) => {
        const done = i < current || (i === current && status === "delivered");
        const active = i === current && status !== "delivered";
        const at = reached.get(step.status);
        return (
          <li key={step.status} className="relative flex gap-4 pb-8 last:pb-0">
            {i < STEPS.length - 1 && <span aria-hidden className={cn("absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px", i < current ? "bg-gold" : "bg-border")} />}
            <span
              aria-hidden
              className={cn(
                "z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs",
                done ? "border-gold bg-gold text-ink" : active ? "border-gold bg-surface text-gold ring-4 ring-gold/20" : "border-border bg-surface text-muted",
              )}
            >
              {done ? <Check size={14} /> : i + 1}
            </span>
            <div className="flex flex-col gap-0.5 pt-0.5">
              <span className={cn("text-sm", done || active ? "text-ink" : "text-muted")}>
                {step.label}
                {active && <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] uppercase tracking-wide text-ink">Current</span>}
              </span>
              {at && (done || active) ? <span className="text-xs text-muted">{when(at)}</span> : null}
              {active && <span className="text-xs text-muted">{step.hint}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
