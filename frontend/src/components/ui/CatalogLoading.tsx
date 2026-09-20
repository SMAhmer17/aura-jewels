"use client";

import { Button } from "@/components/ui/Button";
import { retryCatalog } from "@/store/StoreHydration";

/** Shown by storefront pages until the first catalog load finishes, or offers a retry if it failed. */
export function CatalogLoading({ failed }: { failed: boolean }) {
  if (failed) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-24 text-center">
        <h2 className="text-2xl text-ink">We couldn&apos;t load the shop</h2>
        <p className="text-sm text-muted">Please check your connection and try again.</p>
        <Button variant="outline" onClick={retryCatalog}>
          Try again
        </Button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6" role="status" aria-label="Loading">
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-[4/5] animate-pulse bg-cream" />
            <div className="h-4 w-2/3 animate-pulse bg-cream" />
            <div className="h-4 w-1/3 animate-pulse bg-cream" />
          </div>
        ))}
      </div>
    </div>
  );
}
