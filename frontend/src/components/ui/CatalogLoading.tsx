"use client";

import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
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
  return <PageLoader />;
}
