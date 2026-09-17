"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Products", href: "/dashboard/products" },
  { label: "Categories", href: "/dashboard/categories" },
  { label: "Inventory", href: "/dashboard/inventory" },
  { label: "Orders", href: "/dashboard/orders" },
  { label: "Customers", href: "/dashboard/customers" },
  { label: "Discounts", href: "/dashboard/discounts" },
  { label: "Analytics", href: "/dashboard/analytics" },
  { label: "Settings", href: "/dashboard/settings" },
];

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-border bg-surface px-4 py-3 md:hidden">
      {navItems.map((item) => {
        const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs whitespace-nowrap",
              active ? "border-ink bg-ink text-ivory" : "border-border text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
