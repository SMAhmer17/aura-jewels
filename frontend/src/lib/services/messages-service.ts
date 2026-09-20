import { useMessagesStore } from "@/store/messages-store";
import { api } from "@/lib/api/client";
import type { ContactMessage, MessageStatus } from "@/types/message";

export interface NewMessage {
  name: string;
  email: string;
  phone?: string;
  orderNumber?: string;
  message: string;
  /** Hidden anti-spam field. Real visitors leave it empty. */
  website?: string;
}

/** Sends a customer's inquiry from the contact form. */
export async function sendMessage(input: NewMessage) {
  await api("/contact", {
    method: "POST",
    body: {
      name: input.name,
      email: input.email,
      phone: input.phone || undefined,
      orderNumber: input.orderNumber || undefined,
      message: input.message,
      website: input.website || undefined,
    },
  });
}

// ---------------- Admin ----------------

export async function loadMessages(): Promise<void> {
  useMessagesStore.getState().setMessages(await api<ContactMessage[]>("/admin/messages", { as: "admin" }));
}

export function useMessages(): ContactMessage[] {
  return useMessagesStore((state) => state.messages);
}

export async function setMessageStatus(id: string, status: MessageStatus) {
  await api(`/admin/messages/${id}`, { method: "PATCH", as: "admin", body: { status } });
  await loadMessages();
}

export async function removeMessage(id: string) {
  await api(`/admin/messages/${id}`, { method: "DELETE", as: "admin" });
  await loadMessages();
}

/** Number of messages still waiting for the owner to read, for the sidebar badge and summary. */
export function useUnreadMessageCount(): number {
  return useMessagesStore((state) => state.messages.filter((m) => m.status === "unread").length);
}
