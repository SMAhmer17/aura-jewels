import { UNCATEGORIZED_ID } from "@/store/catalog-store";
import type { Category } from "@/types/category";
import type { Discount } from "@/types/discount";
import type { Order } from "@/types/order";
import type { Product } from "@/types/product";
import type { Review } from "@/types/review";

/**
 * The API speaks JSON with nulls; the UI types use optional fields. These are the only places
 * that translate between the two, so components never see API quirks.
 */

interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

export function toCategory(c: ApiCategory): Category {
  return { id: c.id, name: c.name, slug: c.slug, description: c.description ?? undefined, createdAt: c.createdAt };
}

interface ApiProduct extends Omit<Product, "compareAtPrice" | "categoryId"> {
  compareAtPrice: number | null;
  categoryId: string | null;
}

export function toProduct(p: ApiProduct): Product {
  return {
    ...p,
    compareAtPrice: p.compareAtPrice ?? undefined,
    categoryId: p.categoryId ?? UNCATEGORIZED_ID,
    images: p.images ?? [],
  };
}

type ApiOrder = Omit<Order, "discountCode" | "giftBoxFee" | "notes"> & {
  discountCode: string | null;
  giftBoxFee: number | null;
  notes?: string | null;
};

export function toOrder(o: ApiOrder): Order {
  return {
    ...o,
    discountCode: o.discountCode ?? undefined,
    giftBoxFee: o.giftBoxFee ?? undefined,
    notes: o.notes ?? undefined,
  };
}

type ApiDiscount = Omit<Discount, "startsAt" | "endsAt"> & { startsAt: string | null; endsAt: string | null };

export function toDiscount(d: ApiDiscount): Discount {
  return { ...d, startsAt: d.startsAt ?? null, endsAt: d.endsAt ?? null };
}

export const toReview = (r: Review): Review => r;

/** The API stores "no category" as null. */
export const categoryIdForApi = (id: string | undefined) => (!id || id === UNCATEGORIZED_ID ? null : id);
