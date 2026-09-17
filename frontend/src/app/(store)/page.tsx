"use client";

import Link from "next/link";
import { ShieldCheck, Truck, RefreshCcw } from "lucide-react";
import { useCategories, useFeaturedProducts } from "@/lib/services/catalog-service";
import { ProductCard } from "@/components/features/product/ProductCard";
import { ProductImagePlaceholder } from "@/components/features/product/ProductImagePlaceholder";
import { LinkButton } from "@/components/ui/LinkButton";
import { Reveal } from "@/components/ui/Reveal";

const trustPoints = [
  { icon: ShieldCheck, label: "Quality checked before shipping" },
  { icon: Truck, label: "Nationwide delivery across Pakistan" },
  { icon: RefreshCcw, label: "7-day easy returns" },
];

export default function Home() {
  const categories = useCategories();
  const featured = useFeaturedProducts();

  return (
    <div className="flex flex-col">
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-ink px-6 py-24 text-center text-ivory">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Aura Jewels · By ZAS</p>
        <h1 className="max-w-2xl text-4xl leading-tight sm:text-5xl">
          Jewellery made for the moments you remember
        </h1>
        <p className="max-w-md text-sm text-muted">
          Considered pieces in gold, silver, and stone, designed in Pakistan for everyday
          elegance and occasions worth marking.
        </p>
        <LinkButton href="/shop" variant="gold" size="lg" className="mt-2">
          Shop the Collection
        </LinkButton>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <Reveal className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl text-ink sm:text-3xl">Shop by Category</h2>
          <Link href="/shop" className="text-sm text-ink underline underline-offset-4">
            View All
          </Link>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category, i) => (
            <Reveal key={category.id} delay={(i % 5) * 60}>
              <Link href={`/shop/${category.slug}`} className="group flex flex-col gap-3">
                <div className="aspect-square overflow-hidden rounded-(--radius-md) border border-border">
                  <ProductImagePlaceholder
                    id={category.id}
                    className="h-full w-full transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <span className="text-center text-sm text-ink">{category.name}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
          <Reveal className="mb-8 flex items-end justify-between">
            <h2 className="text-2xl text-ink sm:text-3xl">Bestsellers</h2>
            <Link href="/shop" className="text-sm text-ink underline underline-offset-4">
              View All
            </Link>
          </Reveal>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((product, i) => (
              <Reveal key={product.id} delay={(i % 4) * 60}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-border bg-cream/50 px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 text-center sm:grid-cols-3">
          {trustPoints.map(({ icon: Icon, label }, i) => (
            <Reveal key={label} delay={i * 100}>
              <div className="flex flex-col items-center gap-3">
                <Icon size={22} className="text-gold" />
                <p className="text-sm text-ink">{label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
