import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/** A grey block with a light sweep, shown where content is still loading. Give it the size of what it stands in for. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("shimmer relative rounded-(--radius-sm)", className)} {...props} />;
}
