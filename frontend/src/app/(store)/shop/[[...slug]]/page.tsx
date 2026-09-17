"use client";

import { useParams } from "next/navigation";
import {
  useCategories,
  useCategoryBySlug,
  useProducts,
  useProductsByCategoryId,
} from "@/lib/services/catalog-service";
import { ProductCard } from "@/components/features/product/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { Reveal } from "@/components/ui/Reveal";

export default function ShopPage() {
  const params = useParams<{ slug?: string[] }>();
  const slug = params.slug?.[0];

  const categories = useCategories();
  const category = useCategoryBySlug(slug ?? "");
  const allProducts = useProducts();
  const categoryProducts = useProductsByCategoryId(category?.id ?? "");

  const showingCategory = Boolean(slug);
  const invalidCategory = showingCategory && !category;
  const products = showingCategory ? categoryProducts : allProducts;

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
          description="New pieces are being added to this collection soon."
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
    </div>
  );
}
