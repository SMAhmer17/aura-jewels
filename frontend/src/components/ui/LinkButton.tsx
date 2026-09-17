import Link, { type LinkProps } from "next/link";
import { type AnchorHTMLAttributes } from "react";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export interface LinkButtonProps
  extends LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>,
    VariantProps<typeof buttonVariants> {}

export function LinkButton({ className, variant, size, ...props }: LinkButtonProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
