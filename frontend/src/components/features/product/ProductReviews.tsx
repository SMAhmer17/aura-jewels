"use client";

import { useState, type FormEvent } from "react";
import { BadgeCheck, Star } from "lucide-react";
import { addReview, useProductReviews } from "@/lib/services/reviews-service";
import { errorMessage } from "@/lib/api/client";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils/cn";

const MIN_COMMENT = 10;
const RATING_WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export function ProductReviews({ productId }: { productId: string }) {
  const reviews = useProductReviews(productId);
  const account = useCustomerAuthStore((s) => s.customer);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ author: "", email: "", title: "", comment: "" });
  const [rating, setRating] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const counts = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((r) => r.rating === stars).length }));

  function openForm() {
    // Signed-in customers start with their details filled in.
    setForm((prev) => ({ ...prev, author: prev.author || account?.name || "", email: prev.email || account?.email || "" }));
    setError("");
    setFormOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please choose a star rating.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await addReview({ productId, author: form.author.trim(), email: form.email.trim(), rating, title: form.title.trim(), comment: form.comment.trim() });
      toast({ title: "Thank you for your review", variant: "success" });
      setForm({ author: "", email: "", title: "", comment: "" });
      setRating(0);
      setFormOpen(false);
      setSubmitted(true);
    } catch (err) {
      setError(errorMessage(err, "We could not send your review. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-20 border-t border-border pt-12" aria-labelledby="reviews-heading">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-4">
          <h2 id="reviews-heading" className="text-2xl text-ink">Customer Reviews</h2>
          {reviews.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-4xl text-ink">{average.toFixed(1)}</span>
                <StarRating value={average} size={18} />
                <span className="text-xs text-muted">Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
              </div>
              <ul className="flex w-56 flex-col gap-1.5" aria-label="Rating breakdown">
                {counts.map(({ stars, count }) => (
                  <li key={stars} className="flex items-center gap-2 text-xs text-muted">
                    <span className="w-3 text-right">{stars}</span>
                    <Star size={11} className="fill-gold text-gold" />
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                      <span className="block h-full bg-gold" style={{ width: `${(count / reviews.length) * 100}%` }} />
                    </span>
                    <span className="w-4">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted">No reviews yet. Be the first to share your thoughts.</p>
          )}
        </div>
        {!formOpen && (
          <Button variant="outline" size="md" onClick={openForm}>
            Write a Review
          </Button>
        )}
      </div>

      {submitted && !formOpen && (
        <p role="status" className="mt-6 rounded-(--radius-md) border border-success/30 bg-success/10 p-4 text-sm text-ink">
          Thank you! Your review is now on this page.
        </p>
      )}

      {formOpen && (
        <form onSubmit={handleSubmit} className="mt-8 flex max-w-xl flex-col gap-5 rounded-(--radius-md) border border-border p-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Your rating</span>
            <div className="flex items-center gap-3">
              <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)}>
                    <Star size={28} strokeWidth={1.5} className={cn(n <= rating ? "fill-gold text-gold" : "text-border")} />
                  </button>
                ))}
              </div>
              <span className="text-sm text-muted">{RATING_WORDS[rating]}</span>
            </div>
          </div>

          <Input label="Review title (optional)" placeholder="Sum it up in a few words" maxLength={100} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />

          <Textarea
            label="Your review"
            placeholder="What did you like? How is the quality, finish and fit?"
            required
            rows={4}
            minLength={MIN_COMMENT}
            maxLength={2000}
            value={form.comment}
            onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
            hint={`At least ${MIN_COMMENT} characters`}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input label="Your name" placeholder="Enter your name" required maxLength={80} value={form.author} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} hint="Shown next to your review" />
            <Input label="Your email" type="email" placeholder="Enter your email address" required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} hint="Never shown. Used to confirm your purchase" />
          </div>

          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" variant="primary" size="md" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {reviews.length > 0 && (
        <ul className="mt-8 flex flex-col divide-y divide-border">
          {reviews.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 py-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-base text-ink">{r.author}</span>
                  {r.verifiedBuyer && (
                    <span className="inline-flex items-center gap-1 text-xs text-success">
                      <BadgeCheck size={14} />
                      Verified buyer
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted">
                  {new Date(r.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <StarRating value={r.rating} size={14} />
              {r.title && <p className="text-sm font-medium text-ink">{r.title}</p>}
              <p className="text-sm leading-relaxed text-muted">{r.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
