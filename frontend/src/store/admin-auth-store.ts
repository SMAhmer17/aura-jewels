import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminAuthState {
  token: string | null;
  email: string | null;
  isAuthenticated: boolean;
  setSession: (token: string, email: string) => void;
  logout: () => void;
}

/**
 * The admin's API session. The token comes from `POST /auth/admin/login` and is sent as a
 * Bearer header on every dashboard call; the API is what actually enforces access.
 * Persisted so a refresh doesn't sign the admin out.
 */
export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      email: null,
      isAuthenticated: false,
      setSession: (token, email) => set({ token, email, isAuthenticated: true }),
      logout: () => set({ token: null, email: null, isAuthenticated: false }),
    }),
    {
      name: "aura-jewels-admin-session",
      skipHydration: true,
      // Derived from the token so a stored session can never disagree with itself.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AdminAuthState>;
        return { ...current, token: saved.token ?? null, email: saved.email ?? null, isAuthenticated: !!saved.token };
      },
    },
  ),
);
