"use client";

import { useParams } from "next/navigation";
import {
  useCatalogReady,
  useCategories,
  useCategoryBySlug,
  useProducts,
  useProductsByCategoryId,
  useSoldOutProducts,
} from "@/lib/services/catalog-service";
import { ProductCard } from "@/components/features/product/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { CatalogLoading } from "@/components/ui/CatalogLoading";
import { LinkButton } from "@/components/ui/LinkButton";
import { Reveal } from "@/components/ui/Reveal";
import { SoldOutShowcase } from "@/components/features/product/SoldOutShowcase";

export default function ShopPage() {
  const params = useParams<{ slug?: string[] }>();
  const slug = params.slug?.[0];

  const categories = useCategories();
  const category = useCategoryBySlug(slug ?? "");
  const allProducts = useProducts();
  const categoryProducts = useProductsByCategoryId(category?.id ?? "");
  const allSold = useSoldOutProducts();

  const { ready, failed } = useCatalogReady();

  const showingCategory = Boolean(slug);
  const invalidCategory = showingCategory && !category;
  const products = showingCategory ? categoryProducts : allProducts;
  const sold = showingCategory ? allSold.filter((p) => p.categoryId === category?.id) : allSold;

  if (!ready) return <CatalogLoading failed={failed} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-2">
        <p className="text-xs uppercase tracking-widest text-gold">Shop</p>
        <h1 className="text-3xl text-ink sm:text-4xl">
          {invalidCategory ? "Category not found" : (category?.name ?? "All Jewellery")}
        </h1>
        {category?.description && (
          <p className="max-w-xl text-sm text-muted">{category.description}</p>
        )}
      </div>

      <div className="mb-10 flex flex-wrap gap-2">
        <LinkButton href="/shop" variant={!showingCategory ? "gold" : "outline"} size="sm">
          All
        </LinkButton>
        {categories.map((c) => (
          <LinkButton
            key={c.id}
            href={`/shop/${c.slug}`}
            variant={category?.id === c.id ? "gold" : "outline"}
            size="sm"
          >
            {c.name}
          </LinkButton>
        ))}
      </div>

      {invalidCategory ? (
        <EmptyState
          title="We couldn't find that category"
          description="It may have been renamed or removed."
          action={
            <LinkButton href="/shop" variant="outline" size="md">
              Browse All Jewellery
            </LinkButton>
          }
        />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description={
            sold.length > 0
              ? "Everything here has sold. See what found a home below, and check back for new pieces."
              : "New pieces are being added to this collection soon."
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product, i) => (
            <Reveal key={product.id} delay={(i % 4) * 60}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      )}

      {!invalidCategory && (
        <SoldOutShowcase
          products={sold}
          eyebrow="Already Sold"
          heading="Recently sold"
          description="These pieces have found a home. New designs arrive regularly."
          className="mt-20 border-t border-border pt-14"
        />
      )}
    </div>
  );
}
