"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/store/admin-auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  // Rehydrate here (not just via the root StoreHydration) so this check
  // never runs against the pre-hydration default before localStorage loads.
  // The mount-only setState is the standard zustand SSR-hydration pattern.
  useEffect(() => {
    useAdminAuthStore.persist.rehydrate();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecked(true);
  }, []);

  useEffect(() => {
    if (checked && !isAuthenticated) router.replace("/dashboard/login");
  }, [checked, isAuthenticated, router]);

  if (!checked || !isAuthenticated) return null;

  return <>{children}</>;
}
