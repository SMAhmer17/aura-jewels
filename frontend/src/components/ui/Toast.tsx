"use client";

import { useEffect } from "react";
import { useToastStore } from "@/store/toast-store";
import { cn } from "@/lib/utils/cn";

const AUTO_DISMISS_MS = 4000;

function ToastItem({ id, title, description, variant = "default" }: {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error";
}) {
  const remove = useToastStore((s) => s.remove);

  useEffect(() => {
    const timer = setTimeout(() => remove(id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [id, remove]);

  return (
    <div
      role="status"
      className={cn(
        "w-full max-w-sm rounded-(--radius-md) border bg-surface px-4 py-3 shadow-(--shadow-elevated)",
        variant === "success" && "border-success/30",
        variant === "error" && "border-error/30",
        variant === "default" && "border-border",
      )}
    >
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
    </div>
  );
}

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem {...t} />
        </div>
      ))}
    </div>
  );
}
