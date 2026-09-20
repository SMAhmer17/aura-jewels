"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { ProductImage } from "@/components/features/product/ProductImage";
import { useCategories, useFeaturedProducts, useProducts } from "@/lib/services/catalog-service";
import { formatPrice } from "@/lib/utils/currency";

function SearchPanel({ onClose }: { onClose: () => void }) {
  const products = useProducts();
  const categories = useCategories();
  const featured = useFeaturedProducts();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(timer);
  }, []);

  const term = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!term) return [];
    return products
      .filter((p) => `${p.name} ${p.material} ${p.description}`.toLowerCase().includes(term))
      .slice(0, 8);
  }, [products, term]);

  return (
    <div className="flex flex-col">
      <div className="border-b border-ink/10 px-6 py-4">
        <div className="flex h-12 items-center gap-3 rounded-(--radius-sm) border border-ink/15 bg-white/50 px-4 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30">
          <Search size={18} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="h-full w-full bg-transparent text-base text-ink placeholder:text-muted focus:outline-none"
          />
        </div>
      </div>

      {!term && (
        <div className="flex flex-col gap-8 px-6 py-8">
          {categories.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Browse by category</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/shop/${category.slug}`}
                    onClick={onClose}
                    className="inline-flex h-10 items-center rounded-(--radius-sm) border border-ink/15 bg-white/60 px-4 text-sm text-ink transition-colors hover:border-gold hover:bg-gold/10"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {featured.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Popular right now</p>
              <ul className="flex flex-col divide-y divide-ink/10 border-y border-ink/10">
                {featured.slice(0, 4).map((product) => (
                  <li key={product.id}>
                    <Link href={`/product/${product.slug}`} onClick={onClose} className="flex items-center gap-4 py-3 transition-colors hover:text-gold">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-(--radius-sm) border border-border">
                        <ProductImage id={product.id} images={product.images} alt="" className="h-full w-full" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-ink">{product.name}</span>
                        <span className="text-xs text-muted">{formatPrice(product.price)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {term && results.length === 0 && (
        <p className="px-6 py-10 text-center text-sm text-muted">
          No products found for &ldquo;{query.trim()}&rdquo;.
        </p>
      )}

      {results.length > 0 && (
        <ul className="flex flex-col divide-y divide-ink/10">
          {results.map((product) => (
            <li key={product.id}>
              <Link
                href={`/product/${product.slug}`}
                onClick={onClose}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/40"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-(--radius-sm) border border-border">
                  <ProductImage id={product.id} images={product.images} alt={product.name} className="h-full w-full" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-base text-ink">{product.name}</span>
                  <span className="text-xs text-muted">{product.material}</span>
                  <span className="text-sm text-ink">{formatPrice(product.price)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SearchDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer open={open} onClose={onClose} title="Search our site">
      <SearchPanel onClose={onClose} />
    </Drawer>
  );
}
