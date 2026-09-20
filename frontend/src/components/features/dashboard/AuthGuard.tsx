"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/store/admin-auth-store";
import { loadAdminData } from "@/lib/services/admin-data";
import { errorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";

type DataState = "loading" | "ready" | "failed";

/**
 * Keeps signed-out visitors out of the dashboard and loads the admin's data before any screen renders,
 * so pages never flash "no products yet" while the API is still answering. The API is what really
 * enforces access; this only decides what to show.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [data, setData] = useState<DataState>("loading");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
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

  useEffect(() => {
    if (!checked || !isAuthenticated) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData("loading");
    loadAdminData()
      .then(() => !cancelled && setData("ready"))
      .catch((e) => {
        if (cancelled) return;
        setError(errorMessage(e, "Could not load the dashboard."));
        setData("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [checked, isAuthenticated, attempt]);

  if (!checked || !isAuthenticated) return null;

  if (data === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted" role="status">
        Loading dashboard...
      </div>
    );
  }

  if (data === "failed") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-ink">{error}</p>
        <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>
          Try again
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
