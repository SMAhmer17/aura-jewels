export type MessageStatus = "unread" | "read" | "resolved";

/** An inquiry sent from the storefront contact form. */
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  orderNumber: string | null;
  message: string;
  status: MessageStatus;
  createdAt: string;
}
