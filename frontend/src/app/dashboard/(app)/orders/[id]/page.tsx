"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { updateOrderDetails, updateOrderStatus, useAdminOrder } from "@/lib/services/orders-service";
import type { OrderStatus, PaymentStatus } from "@/types/order";
import {
  orderStatusOptions,
  orderStatusVariant,
  paymentStatusOptions,
  paymentStatusVariant,
} from "@/lib/utils/order-status";
import { OrderItemImage } from "@/components/features/order/OrderItemImage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { Textarea } from "@/components/ui/Textarea";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { formatPrice } from "@/lib/utils/currency";
import { toast } from "@/store/toast-store";
import { errorMessage } from "@/lib/api/client";

const selectClass =
  "h-11 rounded-(--radius-sm) border border-border bg-surface px-3 text-sm capitalize text-ink focus:border-gold focus:outline-none print:hidden";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { order, loading } = useAdminOrder(params.id);
  const [notes, setNotes] = useState<string | null>(null);

  if (loading) return <p className="py-16 text-center text-sm text-muted" role="status">Loading order...</p>;

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="It may have been removed."
        action={<LinkButton href="/dashboard/orders" variant="outline" size="md">Back to Orders</LinkButton>}
      />
    );
  }

  const notesValue = notes ?? order.notes ?? "";
  const timeline = order.timeline ?? [{ status: "pending" as OrderStatus, at: order.createdAt }];
  const payment = order.paymentStatus ?? "unpaid";

  async function handleStatus(status: OrderStatus) {
    if (!order) return;
    try {
      const result = await updateOrderStatus(order.id, status);
      if (result === "restocked") toast({ title: "Order cancelled", description: "Items were returned to stock.", variant: "success" });
      else if (result === "deducted") toast({ title: "Order reopened", description: "Items were taken out of stock again." });
    } catch (error) {
      toast({ title: "Could not update the order", description: errorMessage(error), variant: "error" });
    }
  }

  async function handleDetails(patch: { paymentStatus?: PaymentStatus; notes?: string }, success?: string) {
    if (!order) return;
    try {
      await updateOrderDetails(order.id, patch);
      if (patch.notes !== undefined) setNotes(null);
      if (success) toast({ title: success, variant: "success" });
    } catch (error) {
      toast({ title: "Could not save the change", description: errorMessage(error), variant: "error" });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard/orders" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink print:hidden">
        <ArrowLeft size={14} />
        Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl text-ink sm:text-3xl">{order.orderNumber}</h1>
          <p className="text-sm text-muted">Placed {new Date(order.createdAt).toLocaleString()}</p>
          <div className="mt-3 flex gap-2">
            <Badge variant={orderStatusVariant[order.status]} className="capitalize">{order.status}</Badge>
            <Badge variant={paymentStatusVariant[payment]} className="capitalize">{payment}</Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
          <Printer size={14} />
          Print
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Item</TableHeaderCell>
                <TableHeaderCell>Size</TableHeaderCell>
                <TableHeaderCell>Qty</TableHeaderCell>
                <TableHeaderCell className="text-right">Total</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={`${item.productId}-${item.variantId}-${item.size}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <OrderItemImage item={item} className="h-14 w-14" />
                      <span>{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted">{item.size}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatPrice(item.price * item.quantity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Card>
            <CardContent className="flex flex-col gap-2 text-sm text-muted">
              <div className="flex justify-between"><span>Subtotal</span><span className="text-ink">{formatPrice(order.subtotal)}</span></div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between"><span>Discount {order.discountCode && `(${order.discountCode})`}</span><span className="text-ink">&minus;{formatPrice(order.discountAmount)}</span></div>
              )}
              {order.giftBoxFee ? <div className="flex justify-between"><span>Gift box</span><span className="text-ink">{formatPrice(order.giftBoxFee)}</span></div> : null}
              <div className="flex justify-between"><span>Shipping</span><span className="text-ink">{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span></div>
              <div className="flex justify-between border-t border-border pt-3 text-base text-ink"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-1 text-sm">
              <h2 className="mb-2 text-base text-ink">Customer</h2>
              <span className="text-ink">{order.customerName}</span>
              <span className="text-muted">{order.email}</span>
              <span className="text-muted">{order.phone}</span>
              <span className="mt-2 text-muted">{order.address}, {order.city}</span>
            </CardContent>
          </Card>

          <Card className="print:hidden">
            <CardContent className="flex flex-col gap-4">
              <h2 className="text-base text-ink">Manage</h2>
              <label className="flex flex-col gap-1.5 text-sm text-ink">
                Order status
                <select value={order.status} onChange={(e) => handleStatus(e.target.value as OrderStatus)} className={selectClass}>
                  {orderStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-ink">
                Payment status
                <select value={payment} onChange={(e) => handleDetails({ paymentStatus: e.target.value as PaymentStatus })} className={selectClass}>
                  {paymentStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <Textarea label="Internal notes" placeholder="Add a note about this order. Only you can see it" rows={3} value={notesValue} onChange={(e) => setNotes(e.target.value)} hint="Only visible to you" />
              <Button
                variant="outline"
                size="sm"
                disabled={notesValue === (order.notes ?? "")}
                onClick={() => handleDetails({ notes: notesValue }, "Notes saved")}
              >
                Save notes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4">
              <h2 className="text-base text-ink">Timeline</h2>
              <ol className="flex flex-col gap-4 border-l border-border pl-5">
                {[...timeline].reverse().map((event, i) => (
                  <li key={`${event.status}-${event.at}-${i}`} className="relative text-sm">
                    <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-gold" />
                    <span className="capitalize text-ink">{event.status === "pending" && i === timeline.length - 1 ? "Order placed" : event.status}</span>
                    <span className="block text-xs text-muted">{new Date(event.at).toLocaleString()}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
