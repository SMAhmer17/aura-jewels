import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex flex-col items-center leading-none", className)}>
      <span className="font-heading text-xl tracking-[0.2em] sm:text-2xl">AURA JEWELS</span>
      <span className="mt-1 text-[9px] font-body tracking-[0.35em] text-gold sm:text-[10px]">
        BY ZAS
      </span>
    </Link>
  );
}
