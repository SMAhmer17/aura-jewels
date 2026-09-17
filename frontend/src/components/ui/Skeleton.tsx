import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-(--radius-sm) bg-ink/8", className)}
      {...props}
    />
  );
}
