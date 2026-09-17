"use client";

import { useWishlistProducts } from "@/lib/services/wishlist-service";
import { ProductCard } from "@/components/features/product/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { Reveal } from "@/components/ui/Reveal";

export default function WishlistPage() {
  const products = useWishlistProducts();

  if (products.length === 0) {
    return (
      <EmptyState
        className="mx-auto my-16 max-w-lg"
        title="Your wishlist is empty"
        description="Save the pieces you love and come back to them anytime."
        action={
          <LinkButton href="/shop" variant="primary" size="md">
            Start Browsing
          </LinkButton>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl text-ink sm:text-4xl">Your Wishlist</h1>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product, i) => (
          <Reveal key={product.id} delay={(i % 4) * 60}>
            <ProductCard product={product} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
