"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Search, Heart, User, ShoppingBag, X } from "lucide-react";
import { useCategories } from "@/lib/services/catalog-service";
import { useCartCount } from "@/lib/services/cart-service";
import { useWishlistStore } from "@/store/wishlist-store";
import { MobileNav } from "@/components/layout/MobileNav";
import { Logo } from "@/components/layout/Logo";

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

        <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop/${category.slug}`}
              className="text-sm tracking-wide text-ink transition-colors hover:text-gold"
            >
              {category.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4 md:flex-1 md:justify-end">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
            className="text-ink"
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
          <Link href="/wishlist" aria-label="Wishlist" className="relative hidden text-ink sm:inline-flex">
            <Heart size={20} />
            <IconBadge count={wishlistCount} />
          </Link>
          <Link href="/account" aria-label="Account" className="hidden text-ink sm:inline-flex">
            <User size={20} />
          </Link>
          <Link href="/cart" aria-label="Cart" className="relative text-ink">
            <ShoppingBag size={20} />
            <IconBadge count={cartCount} />
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border bg-ivory px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <input
              autoFocus
              type="search"
              placeholder="Search for rings, necklaces, earrings..."
              className="w-full border-b border-ink bg-transparent py-2 text-base text-ink placeholder:text-muted focus:outline-none"
            />
          </div>
        </div>
      )}

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} categories={categories} />
    </header>
  );
}
