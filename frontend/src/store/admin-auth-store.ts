import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminAuthState {
  isAuthenticated: boolean;
  email: string | null;
  login: (email: string) => void;
  logout: () => void;
}

/**
 * Demo-only mock auth: any non-empty email/password "logs in". There's no
 * real backend yet, so this never claims to be secure — replace with real
 * Supabase Auth in Phase 2. Persisted so a page refresh doesn't log the
 * admin out mid-session.
 */
export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      email: null,
      login: (email) => set({ isAuthenticated: true, email }),
      logout: () => set({ isAuthenticated: false, email: null }),
    }),
    { name: "aura-jewels-admin-auth", skipHydration: true },
  ),
);
