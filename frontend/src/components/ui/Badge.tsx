import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-(--radius-sm) border px-2.5 py-1 text-xs font-medium tracking-wide uppercase",
  {
    variants: {
      variant: {
        neutral: "border-border text-muted bg-transparent",
        gold: "border-gold text-ink bg-gold/10",
        success: "border-success/30 text-success bg-success/10",
        error: "border-error/30 text-error bg-error/10",
        dark: "border-border-dark text-ivory bg-ink",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
