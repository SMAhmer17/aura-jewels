import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface CustomerAuthState {
  token: string | null;
  customer: CustomerProfile | null;
  isAuthenticated: boolean;
  setSession: (token: string, customer: CustomerProfile) => void;
  logout: () => void;
}

/** The optional customer account session. Guests can still check out without one. */
export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set) => ({
      token: null,
      customer: null,
      isAuthenticated: false,
      setSession: (token, customer) => set({ token, customer, isAuthenticated: true }),
      logout: () => set({ token: null, customer: null, isAuthenticated: false }),
    }),
    {
      name: "aura-jewels-customer-session",
      skipHydration: true,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<CustomerAuthState>;
        return { ...current, token: saved.token ?? null, customer: saved.customer ?? null, isAuthenticated: !!saved.token };
      },
    },
  ),
);
