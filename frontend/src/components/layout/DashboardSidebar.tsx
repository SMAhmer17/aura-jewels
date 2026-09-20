"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  House,
  Package,
  Tag,
  Boxes,
  ClipboardList,
  Users,
  Percent,
  TrendingUp,
  Settings,
  MessageSquare,
  Star,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { adminLogout } from "@/lib/services/auth-service";
import { useUnreadMessageCount } from "@/lib/services/messages-service";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Home Page", href: "/dashboard/home-page", icon: House },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Categories", href: "/dashboard/categories", icon: Tag },
  { label: "Inventory", href: "/dashboard/inventory", icon: Boxes },
  { label: "Orders", href: "/dashboard/orders", icon: ClipboardList },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Reviews", href: "/dashboard/reviews", icon: Star },
  { label: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Discounts", href: "/dashboard/discounts", icon: Percent },
  { label: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const unreadMessages = useUnreadMessageCount();

  function handleLogout() {
    adminLogout();
    router.push("/dashboard/login");
  }

  return (
    <aside className="hidden print:hidden! w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
      <Link href="/" className="mb-8 px-2">
        <span className="font-heading text-lg tracking-[0.15em] text-ink">AURA JEWELS</span>
        <span className="block text-[10px] tracking-[0.3em] text-gold">ADMIN</span>
      </Link>
      <nav className="flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-(--radius-sm) px-3 py-2.5 text-sm transition-colors",
                active ? "bg-ink text-ivory" : "text-ink hover:bg-cream",
              )}
            >
              <item.icon size={16} />
              {item.label}
              {item.href === "/dashboard/messages" && unreadMessages > 0 && (
                <span className="ml-auto rounded-full bg-gold px-2 py-0.5 text-[11px] font-medium text-ink">{unreadMessages}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-3 px-2 pt-6 text-xs text-muted">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 text-left hover:text-ink"
        >
          <LogOut size={14} />
          Log Out
        </button>
        <Link href="/" className="underline underline-offset-4 hover:text-ink">
          &larr; Back to store
        </Link>
      </div>
    </aside>
  );
}
