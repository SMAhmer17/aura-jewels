import { create } from "zustand";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error";
}

interface ToastState {
  toasts: Toast[];
  add: (toast: Omit<Toast, "id">) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  remove: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function toast(input: Omit<Toast, "id">) {
  useToastStore.getState().add(input);
}
