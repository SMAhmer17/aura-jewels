"use client";

import { useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import { addReview, useProductReviews } from "@/lib/services/reviews-service";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils/cn";

export function ProductReviews({ productId }: { productId: string }) {
  const reviews = useProductReviews(productId);
  const [formOpen, setFormOpen] = useState(false);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    addReview({ productId, author: author.trim(), rating, comment: comment.trim() });
    toast({ title: "Thanks for your review", variant: "success" });
    setAuthor("");
    setComment("");
    setRating(5);
    setFormOpen(false);
  }

  return (
    <section className="mt-20 border-t border-border pt-12" aria-labelledby="reviews-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="reviews-heading" className="text-2xl text-ink">Customer Reviews</h2>
          {reviews.length > 0 ? (
            <div className="mt-2 flex items-center gap-3">
              <StarRating value={average} size={18} />
              <span className="text-sm text-muted">
                {average.toFixed(1)} out of 5 ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">No reviews yet. Be the first to share your thoughts.</p>
          )}
        </div>
        {!formOpen && (
          <Button variant="outline" size="md" onClick={() => setFormOpen(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="mt-8 flex max-w-xl flex-col gap-4 rounded-(--radius-md) border border-border p-6">
          <Input label="Your name" required value={author} onChange={(e) => setAuthor(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Rating</span>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => setRating(n)}
                >
                  <Star size={26} strokeWidth={1.5} className={cn(n <= rating ? "fill-gold text-gold" : "text-border")} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="review-comment" className="text-sm font-medium text-ink">Your review</label>
            <textarea
              id="review-comment"
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="rounded-(--radius-sm) border border-border bg-surface px-4 py-3 text-base text-ink focus:border-gold focus:outline-none"
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" variant="primary" size="md">Submit Review</Button>
            <Button type="button" variant="ghost" size="md" onClick={() => setFormOpen(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {reviews.length > 0 && (
        <ul className="mt-8 flex flex-col divide-y divide-border">
          {reviews.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 py-6">
              <div className="flex items-center justify-between gap-3">
                <span className="text-base text-ink">{r.author}</span>
                <span className="text-xs text-muted">
                  {new Date(r.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <StarRating value={r.rating} size={14} />
              <p className="text-sm leading-relaxed text-muted">{r.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
