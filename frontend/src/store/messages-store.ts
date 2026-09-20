import { create } from "zustand";
import type { ContactMessage } from "@/types/message";

interface MessagesState {
  messages: ContactMessage[];
  setMessages: (messages: ContactMessage[]) => void;
}

export const useMessagesStore = create<MessagesState>()((set) => ({
  messages: [],
  setMessages: (messages) => set({ messages }),
}));
