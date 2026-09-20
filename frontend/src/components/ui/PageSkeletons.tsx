import { BrandMark } from "@/components/ui/BrandMark";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";

/** Wraps a skeleton so screen readers hear "Loading" once, instead of a set of empty boxes. */
function LoadingRegion({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
    </div>
  );
}

/** A picture that is still loading: the shimmer block with the brand wordmark in the middle. */
function ImageSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton className={cn("flex items-center justify-center @container", className)}>
      <BrandMark />
    </Skeleton>
  );
}

/** A grid of product cards that are still loading. */
export function ProductGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <ImageSkeleton className="aspect-square w-full rounded-(--radius-md)" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/** A shop-style page: a heading, some filter pills, and a grid of products. */
export function ShopPageSkeleton() {
  return (
    <LoadingRegion label="Loading" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-4 h-9 w-64 max-w-full" />
      <div className="mb-10 mt-8 flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <ProductGridSkeleton />
    </LoadingRegion>
  );
}

/** A product page: a big picture with thumbnails on one side, the details on the other. */
export function ProductDetailSkeleton() {
  return (
    <LoadingRegion label="Loading product" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Skeleton className="mb-8 h-3 w-48" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <ImageSkeleton className="aspect-square w-full rounded-(--radius-md)" />
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
            {Array.from({ length: 4 }, (_, i) => (
              <ImageSkeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-1/4" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-14" />
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-12 w-full sm:flex-1" />
            <Skeleton className="h-12 w-full sm:w-40" />
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}

/** A dashboard list page: a title, a row of filters, and table rows. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <LoadingRegion label="Loading" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-3 w-72 max-w-full" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="flex flex-col divide-y divide-border rounded-(--radius-md) border border-border bg-surface">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="h-10 w-10 shrink-0" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="ml-auto h-4 w-16" />
            <Skeleton className="hidden h-4 w-20 sm:block" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

/** The brand name with a gold line sweeping under it. Used where a whole screen is waiting. */
export function BrandLoader({ label = "Loading", fullScreen = false }: { label?: string; fullScreen?: boolean }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={cn("flex flex-col items-center justify-center gap-4", fullScreen ? "min-h-dvh" : "min-h-[50vh]")}>
      <span className="animate-pulse font-heading text-2xl tracking-[0.25em] text-ink motion-reduce:animate-none">AURA JEWELS</span>
      <span aria-hidden className="shimmer-gold relative h-px w-32" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
