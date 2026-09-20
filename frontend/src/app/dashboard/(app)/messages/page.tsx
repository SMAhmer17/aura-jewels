"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Mail, Phone, Trash2 } from "lucide-react";
import { removeMessage, setMessageStatus, useMessages } from "@/lib/services/messages-service";
import { useOrders } from "@/lib/services/orders-service";
import { errorMessage } from "@/lib/api/client";
import { FilterPills, ResultsBar, SearchField } from "@/components/features/dashboard/DashboardFilters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils/cn";
import type { ContactMessage, MessageStatus } from "@/types/message";

type Filter = "all" | MessageStatus;
const statusVariant: Record<MessageStatus, "gold" | "neutral" | "success"> = { unread: "gold", read: "neutral", resolved: "success" };

export default function MessagesPage() {
  const messages = useMessages();
  const orders = useOrders();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);

  const count = (s: MessageStatus) => messages.filter((m) => m.status === s).length;

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return messages.filter((m) => {
      if (filter !== "all" && m.status !== filter) return false;
      if (!term) return true;
      return `${m.name} ${m.email} ${m.phone ?? ""} ${m.orderNumber ?? ""} ${m.message}`.toLowerCase().includes(term);
    });
  }, [messages, filter, query]);

  async function change(message: ContactMessage, status: MessageStatus) {
    try {
      await setMessageStatus(message.id, status);
    } catch (error) {
      toast({ title: "Could not update the message", description: errorMessage(error), variant: "error" });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await removeMessage(deleteTarget.id);
      toast({ title: "Message deleted" });
      setDeleteTarget(null);
    } catch (error) {
      toast({ title: "Could not delete the message", description: errorMessage(error), variant: "error" });
    }
  }

  const orderFor = (number: string | null) => (number ? orders.find((o) => o.orderNumber === number) : undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink sm:text-3xl">Messages</h1>
        <p className="text-sm text-muted">
          Inquiries from the contact form. Reply by email or phone, then mark them resolved. {count("unread")} unread.
        </p>
      </div>

      {messages.length === 0 ? (
        <EmptyState title="No messages yet" description="When a customer writes to you from the Contact page, it will show up here." />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            <FilterPills
              label="Message status"
              value={filter}
              onChange={setFilter}
              options={[
                { id: "all", label: `All (${messages.length})` },
                { id: "unread", label: `Unread (${count("unread")})` },
                { id: "read", label: `Read (${count("read")})` },
                { id: "resolved", label: `Resolved (${count("resolved")})` },
              ]}
            />
            <SearchField value={query} onChange={setQuery} placeholder="Search name, email, order number, message" label="Search messages" className="lg:w-96" />
            <ResultsBar shown={visible.length} total={messages.length} active={filter !== "all" || query !== ""} onClear={() => { setFilter("all"); setQuery(""); }} />
          </div>

          {visible.length === 0 ? (
            <EmptyState title="No messages match" description="Try a different filter or search." />
          ) : (
            <ul className="flex flex-col gap-4">
              {visible.map((m) => {
                const order = orderFor(m.orderNumber);
                return (
                  <li key={m.id} className={cn("flex flex-col gap-4 rounded-(--radius-md) border bg-surface p-5", m.status === "unread" ? "border-gold" : "border-border")}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base text-ink">{m.name}</span>
                          <Badge variant={statusVariant[m.status]} className="capitalize">{m.status}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                          <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 hover:text-ink"><Mail size={12} />{m.email}</a>
                          {m.phone && <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 hover:text-ink"><Phone size={12} />{m.phone}</a>}
                          <span>{new Date(m.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      {m.orderNumber && (
                        <div className="text-xs text-muted">
                          About order{" "}
                          {order ? (
                            <Link href={`/dashboard/orders/${order.id}`} className="text-ink underline underline-offset-4">{m.orderNumber}</Link>
                          ) : (
                            <span className="text-ink">{m.orderNumber}</span>
                          )}
                          {order && <span> ({order.status})</span>}
                        </div>
                      )}
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{m.message}</p>

                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                      <a
                        href={`mailto:${m.email}?subject=${encodeURIComponent(m.orderNumber ? `Your order ${m.orderNumber}` : "Your message to Aura Jewels")}`}
                        onClick={() => m.status === "unread" && void change(m, "read")}
                        className="inline-flex h-9 items-center rounded-(--radius-sm) border border-gold px-3 text-xs text-ink transition-colors hover:bg-gold/10"
                      >
                        Reply by email
                      </a>
                      {m.status !== "resolved" ? (
                        <Button size="sm" variant="outline" onClick={() => change(m, "resolved")}>Mark resolved</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => change(m, "read")}>Reopen</Button>
                      )}
                      {m.status === "unread" ? (
                        <Button size="sm" variant="ghost" onClick={() => change(m, "read")}>Mark as read</Button>
                      ) : m.status === "read" ? (
                        <Button size="sm" variant="ghost" onClick={() => change(m, "unread")}>Mark as unread</Button>
                      ) : null}
                      <button type="button" aria-label={`Delete message from ${m.name}`} onClick={() => setDeleteTarget(m)} className="ml-auto text-muted hover:text-error">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete message?">
        <p className="mb-6 text-sm text-muted">
          This permanently deletes the message from {deleteTarget?.name}. Mark it resolved instead if you just want it out of the way.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="primary" onClick={confirmDelete}>Delete Message</Button>
        </div>
      </Modal>
    </div>
  );
}
