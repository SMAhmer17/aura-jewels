"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Search, Heart, User, ShoppingBag } from "lucide-react";
import { useCategories } from "@/lib/services/catalog-service";
import { useCartCount } from "@/lib/services/cart-service";
import { useWishlistStore } from "@/store/wishlist-store";
import { MobileNav } from "@/components/layout/MobileNav";
import { Logo } from "@/components/layout/Logo";
import { SearchDrawer } from "@/components/layout/SearchDrawer";
import { AccountDrawer } from "@/components/layout/AccountDrawer";

function IconBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-medium text-ink">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function Header() {
  const categories = useCategories();
  const cartCount = useCartCount();
  const wishlistCount = useWishlistStore((s) => s.productIds.length);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-ivory/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileNavOpen(true)}
          className="text-ink md:hidden"
        >
          <Menu size={22} />
        </button>

        <Logo className="text-ink md:flex-1" />

        <nav className="hidden flex-1 items-center justify-center gap-4 md:flex lg:gap-8">
          <Link href="/" className="text-[13px] tracking-wide text-ink transition-colors hover:text-gold lg:text-sm">
            Home
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop/${category.slug}`}
              className="text-[13px] tracking-wide text-ink transition-colors hover:text-gold lg:text-sm"
            >
              {category.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4 md:flex-1 md:justify-end">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="text-ink"
          >
            <Search size={20} />
          </button>
          <Link href="/wishlist" aria-label="Wishlist" className="relative hidden text-ink sm:inline-flex">
            <Heart size={20} />
            <IconBadge count={wishlistCount} />
          </Link>
          <button
            type="button"
            aria-label="Account"
            onClick={() => setAccountOpen(true)}
            className="text-ink"
          >
            <User size={20} />
          </button>
          <Link href="/cart" aria-label="Cart" className="relative text-ink">
            <ShoppingBag size={20} />
            <IconBadge count={cartCount} />
          </Link>
        </div>
      </div>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} categories={categories} />
      <SearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AccountDrawer open={accountOpen} onClose={() => setAccountOpen(false)} />
    </header>
  );
}
