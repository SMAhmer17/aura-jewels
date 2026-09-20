"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Heart } from "lucide-react";
import {
  useProductBySlug,
  useCategoryById,
  useProducts,
  useCatalogReady,
} from "@/lib/services/catalog-service";
import { addToCart } from "@/lib/services/cart-service";
import { toggleWishlist, useIsWishlisted } from "@/lib/services/wishlist-service";
import { ProductGallery } from "@/components/features/product/ProductGallery";
import { ProductReviews } from "@/components/features/product/ProductReviews";
import { ProductCard } from "@/components/features/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CatalogLoading } from "@/components/ui/CatalogLoading";
import { ProductDetailSkeleton } from "@/components/ui/PageSkeletons";
import { formatPrice } from "@/lib/utils/currency";
import { toast } from "@/store/toast-store";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils/cn";

export default function ProductPage() {
  const { ready, failed } = useCatalogReady();
  // Wait for the catalog so a slow load is never mistaken for "product not found".
  if (failed) return <CatalogLoading failed />;
  if (!ready) return <ProductDetailSkeleton />;
  return <ProductDetail />;
}

function ProductDetail() {
  const params = useParams<{ slug: string }>();
  const product = useProductBySlug(params.slug);
  const category = useCategoryById(product?.categoryId ?? "");
  const allProducts = useProducts();
  const sameCategory = allProducts.filter((p) => p.id !== product?.id && p.categoryId === product?.categoryId);
  const others = allProducts.filter((p) => p.id !== product?.id && p.categoryId !== product?.categoryId);
  const related = [...sameCategory, ...others].slice(0, 4);
  const isWishlisted = useIsWishlisted(product?.id ?? "");

  const [selectedVariantId, setSelectedVariantId] = useState(product?.variants.find((v) => v.stock > 0)?.id ?? product?.variants[0]?.id);
  const selectedVariant = product?.variants.find((v) => v.id === selectedVariantId);

  if (!product) {
    return (
      <EmptyState
        className="mx-auto my-16 max-w-lg"
        title="Product not found"
        description="This piece may have been removed or the link is incorrect."
        action={
          <LinkButton href="/shop" variant="outline" size="md">
            Browse All Jewellery
          </LinkButton>
        }
      />
    );
  }

  function handleAddToCart() {
    if (!product || !selectedVariant) return;
    if (selectedVariant.stock === 0) return;
    addToCart(product.id, selectedVariant.id);
    toast({ title: "Added to cart", description: `${product.name} · ${selectedVariant.size}`, variant: "success" });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="mb-8 flex items-center gap-2 text-xs text-muted">
        <Link href="/shop" className="hover:text-ink">
          Shop
        </Link>
        {category && (
          <>
            <span>/</span>
            <Link href={`/shop/${category.slug}`} className="hover:text-ink">
              {category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery key={product.id} productId={product.id} name={product.name} images={product.images} />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl text-ink sm:text-4xl">{product.name}</h1>
            <p className="text-sm text-muted">{product.material}</p>
            <div className="flex items-center gap-3">
              <span className="text-xl text-ink">{formatPrice(product.price)}</span>
              {product.compareAtPrice && (
                <span className="text-sm text-muted line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm leading-relaxed text-muted">{product.description}</p>

          {product.variants.length > 1 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">{category?.slug === "boxes" ? "Colour" : "Size"}</span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={variant.stock === 0}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={cn(
                      "rounded-(--radius-sm) border px-4 py-2 text-sm transition-colors",
                      variant.id === selectedVariantId
                        ? "border-ink bg-ink text-ivory"
                        : "border-border text-ink hover:border-ink",
                      variant.stock === 0 && "cursor-not-allowed opacity-40 line-through",
                    )}
                  >
                    {variant.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto sm:flex-1"
              disabled={!selectedVariant || selectedVariant.stock === 0}
              onClick={handleAddToCart}
            >
              {selectedVariant?.stock === 0 ? "Sold Out" : "Add to Cart"}
            </Button>
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto"
              onClick={() => toggleWishlist(product.id)}
              aria-pressed={isWishlisted}
            >
              <Heart size={18} className={isWishlisted ? "fill-gold text-gold" : ""} />
              {isWishlisted ? "Saved" : "Wishlist"}
            </Button>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted">
            <p>Free returns within 7 days of delivery.</p>
            <p>Each piece is quality-checked before it ships.</p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="mb-6 text-2xl text-ink">You may also like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      )}

      <ProductReviews productId={product.id} />
    </div>
  );
}
