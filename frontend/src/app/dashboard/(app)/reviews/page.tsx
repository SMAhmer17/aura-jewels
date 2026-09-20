"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Eye, EyeOff, Trash2 } from "lucide-react";
import { removeReview, setReviewPublished, useAdminReviews } from "@/lib/services/reviews-service";
import { errorMessage } from "@/lib/api/client";
import { FilterPills, FilterSelect, ResultsBar, SearchField } from "@/components/features/dashboard/DashboardFilters";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { StarRating } from "@/components/ui/StarRating";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils/cn";
import type { AdminReview } from "@/types/review";

type Visibility = "all" | "visible" | "hidden";
type RatingFilter = "all" | "5" | "4" | "3" | "2" | "1";
type Buyer = "all" | "verified" | "unverified";
type Sort = "newest" | "oldest" | "lowest" | "highest";

export default function ReviewsPage() {
  const reviews = useAdminReviews();
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [rating, setRating] = useState<RatingFilter>("all");
  const [buyer, setBuyer] = useState<Buyer>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);

  const hiddenCount = reviews.filter((r) => !r.isPublished).length;
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = reviews.filter((r) => {
      if (visibility === "visible" && !r.isPublished) return false;
      if (visibility === "hidden" && r.isPublished) return false;
      if (rating !== "all" && r.rating !== Number(rating)) return false;
      if (buyer === "verified" && !r.verifiedBuyer) return false;
      if (buyer === "unverified" && r.verifiedBuyer) return false;
      if (!term) return true;
      return `${r.author} ${r.email ?? ""} ${r.title ?? ""} ${r.comment} ${r.productName}`.toLowerCase().includes(term);
    });
    return list.sort((a, b) => {
      if (sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
      if (sort === "lowest") return a.rating - b.rating || b.createdAt.localeCompare(a.createdAt);
      if (sort === "highest") return b.rating - a.rating || b.createdAt.localeCompare(a.createdAt);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [reviews, visibility, rating, buyer, sort, query]);

  const filtersActive = visibility !== "all" || rating !== "all" || buyer !== "all" || query !== "";
  function clearFilters() {
    setVisibility("all");
    setRating("all");
    setBuyer("all");
    setQuery("");
  }

  async function toggle(review: AdminReview) {
    try {
      await setReviewPublished(review.id, !review.isPublished);
      toast({ title: review.isPublished ? "Review hidden from the storefront" : "Review is visible again", variant: "success" });
    } catch (error) {
      toast({ title: "Could not update the review", description: errorMessage(error), variant: "error" });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await removeReview(deleteTarget.id);
      toast({ title: "Review deleted" });
      setDeleteTarget(null);
    } catch (error) {
      toast({ title: "Could not delete the review", description: errorMessage(error), variant: "error" });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink sm:text-3xl">Reviews</h1>
        <p className="text-sm text-muted">
          New reviews go live straight away. Hide any that should not be public, or delete them. {reviews.length} total
          {reviews.length > 0 ? `, average ${average.toFixed(1)} out of 5` : ""}
          {hiddenCount > 0 ? `, ${hiddenCount} hidden` : ""}.
        </p>
      </div>

      {reviews.length === 0 ? (
        <EmptyState title="No reviews yet" description="Customer reviews from product pages will show up here." />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            <FilterPills
              label="Visibility"
              value={visibility}
              onChange={setVisibility}
              options={[
                { id: "all", label: "All" },
                { id: "visible", label: "Visible" },
                { id: "hidden", label: `Hidden (${hiddenCount})` },
              ]}
            />
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
              <SearchField value={query} onChange={setQuery} placeholder="Search name, email, product, text" label="Search reviews" className="lg:w-80" />
              <FilterSelect label="Rating" value={rating} onChange={setRating} options={[{ id: "all", label: "Any" }, ...(["5", "4", "3", "2", "1"] as const).map((n) => ({ id: n, label: `${n} star${n === "1" ? "" : "s"}` }))]} />
              <FilterSelect label="Buyer" value={buyer} onChange={setBuyer} options={[{ id: "all", label: "Anyone" }, { id: "verified", label: "Verified buyers" }, { id: "unverified", label: "Not verified" }]} />
              <FilterSelect label="Sort" value={sort} onChange={setSort} options={[{ id: "newest", label: "Newest" }, { id: "oldest", label: "Oldest" }, { id: "lowest", label: "Lowest rating" }, { id: "highest", label: "Highest rating" }]} />
            </div>
            <ResultsBar shown={visible.length} total={reviews.length} active={filtersActive} onClear={clearFilters} />
          </div>

          {visible.length === 0 ? (
            <EmptyState title="No reviews match" description="Try different filters." />
          ) : (
            <ul className="flex flex-col gap-4">
              {visible.map((r) => (
                <li key={r.id} className={cn("flex flex-col gap-3 rounded-(--radius-md) border bg-surface p-5", r.isPublished ? "border-border" : "border-dashed border-border opacity-80")}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StarRating value={r.rating} size={15} />
                        {r.verifiedBuyer && (
                          <span className="inline-flex items-center gap-1 text-xs text-success"><BadgeCheck size={14} />Verified buyer</span>
                        )}
                        {!r.isPublished && <Badge variant="neutral">Hidden</Badge>}
                      </div>
                      <Link href={`/product/${r.productSlug}`} target="_blank" className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
                        {r.productName}
                      </Link>
                    </div>
                    <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>

                  {r.title && <p className="text-sm font-medium text-ink">{r.title}</p>}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{r.comment}</p>

                  <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
                    <p className="text-xs text-muted">
                      {r.author}
                      {r.email ? <> &middot; <a href={`mailto:${r.email}`} className="hover:text-ink">{r.email}</a> <span>(private)</span></> : <> &middot; no email on file</>}
                    </p>
                    <div className="ml-auto flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggle(r)}>
                        {r.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                        {r.isPublished ? "Hide" : "Show"}
                      </Button>
                      <button type="button" aria-label={`Delete review by ${r.author}`} onClick={() => setDeleteTarget(r)} className="text-muted hover:text-error">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete review?">
        <p className="mb-6 text-sm text-muted">
          This permanently deletes the review by {deleteTarget?.author}. If you only want it off the storefront, hide it instead. That keeps it here and stops the reviewer from posting a second one.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="primary" onClick={confirmDelete}>Delete Review</Button>
        </div>
      </Modal>
    </div>
  );
}
