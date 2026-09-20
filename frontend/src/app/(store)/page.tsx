"use client";

import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck, Truck, RefreshCcw } from "lucide-react";
import { useCategories, useFeaturedProducts, useSoldOutProducts } from "@/lib/services/catalog-service";
import { useHomeContent } from "@/lib/services/home-content-service";
import { ProductCard } from "@/components/features/product/ProductCard";
import { ProductImagePlaceholder } from "@/components/features/product/ProductImagePlaceholder";
import { LinkButton } from "@/components/ui/LinkButton";
import { Reveal } from "@/components/ui/Reveal";
import { SoldOutShowcase } from "@/components/features/product/SoldOutShowcase";
import { WhyAuraSection } from "@/components/features/home/WhyAuraSection";
import { TestimonialsSection } from "@/components/features/home/TestimonialsSection";
import { SocialFeedSection } from "@/components/features/home/SocialFeedSection";
import type { HomeSectionId } from "@/types/home-content";

const trustIcons = [ShieldCheck, Truck, RefreshCcw];

export default function Home() {
  const categories = useCategories();
  const featured = useFeaturedProducts();
  const soldOut = useSoldOutProducts();
  const content = useHomeContent();

  const sections: Record<HomeSectionId, ReactNode> = {
    categories: (
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <Reveal className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl text-ink sm:text-3xl">{content.categoriesHeading}</h2>
          <Link href="/shop" className="text-sm text-ink underline underline-offset-4">
            View All
          </Link>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category, i) => (
            <Reveal key={category.id} delay={(i % 6) * 60}>
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
    ),
    bestsellers:
      featured.length > 0 ? (
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
          <Reveal className="mb-8 flex items-end justify-between">
            <h2 className="text-2xl text-ink sm:text-3xl">{content.bestsellersHeading}</h2>
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
      ) : null,
    sold:
      soldOut.length > 0 ? (
        <SoldOutShowcase
          products={soldOut}
          eyebrow={content.sold.eyebrow}
          heading={content.sold.heading}
          description={content.sold.description}
          className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6"
        />
      ) : null,
    why: <WhyAuraSection />,
    testimonials: <TestimonialsSection />,
    social: <SocialFeedSection />,
    trust:
      content.trustPoints.length > 0 ? (
        <section className="border-t border-border bg-cream/50 px-4 py-14 sm:px-6">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 text-center sm:grid-cols-3">
            {content.trustPoints.map((point, i) => {
              const Icon = trustIcons[i % trustIcons.length];
              return (
                <Reveal key={point.id} delay={(i % 3) * 100}>
                  <div className="flex flex-col items-center gap-3">
                    <Icon size={22} className="text-gold" />
                    <p className="text-sm text-ink">{point.label}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
      ) : null,
  };

  return (
    <div className="flex flex-col">
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-ink px-6 py-24 text-center text-ivory">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">{content.hero.eyebrow}</p>
        <h1 className="max-w-2xl text-4xl leading-tight sm:text-5xl">{content.hero.heading}</h1>
        <p className="max-w-md text-sm text-muted">{content.hero.body}</p>
        {content.hero.ctaLabel && (
          <LinkButton href={content.hero.ctaHref || "/shop"} variant="gold" size="lg" className="mt-2">
            {content.hero.ctaLabel}
          </LinkButton>
        )}
      </section>

      {content.sections
        .filter((s) => s.visible)
        .map((s) => (
          <Fragment key={s.id}>{sections[s.id]}</Fragment>
        ))}
    </div>
  );
}
