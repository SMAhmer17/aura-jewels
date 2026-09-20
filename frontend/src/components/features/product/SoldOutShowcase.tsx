"use client";

import type { Product } from "@/types/product";
import { ProductImage } from "@/components/features/product/ProductImage";
import { Reveal } from "@/components/ui/Reveal";
import { Badge } from "@/components/ui/Badge";

/** Read-only strip of pieces that have already sold. Not clickable or purchasable. */
export function SoldOutShowcase({
  products,
  eyebrow,
  heading,
  description,
  className,
}: {
  products: Product[];
  eyebrow?: string;
  heading: string;
  description?: string;
  className?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className={className} aria-label={heading}>
      <Reveal className="mx-auto mb-10 max-w-xl text-center">
        {eyebrow && <p className="text-xs uppercase tracking-[0.3em] text-gold">{eyebrow}</p>}
        <h2 className="mt-3 text-2xl text-ink sm:text-3xl">{heading}</h2>
        {description && <p className="mt-3 text-sm text-muted">{description}</p>}
      </Reveal>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
        {products.slice(0, 12).map((product, i) => (
          <Reveal key={product.id} delay={(i % 6) * 60}>
            <div className="flex flex-col gap-3">
              <div className="relative aspect-square overflow-hidden rounded-(--radius-md) border border-border">
                <ProductImage id={product.id} images={product.images} alt={product.name} className="h-full w-full opacity-60 grayscale" />
                <Badge variant="dark" className="absolute left-3 top-3">
                  Sold
                </Badge>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-ink">{product.name}</span>
                <span className="text-xs text-muted">Found a home</span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
