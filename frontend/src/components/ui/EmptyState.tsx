import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-(--radius-md) border border-dashed border-border px-6 py-16 text-center",
        className,
      )}
    >
      {icon && <div className="text-muted">{icon}</div>}
      <h3 className="text-lg text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
