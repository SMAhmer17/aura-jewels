"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, Plus, RotateCcw, Trash2 } from "lucide-react";
import { resetHomeContent, saveHomeContent, useHomeContent } from "@/lib/services/home-content-service";
import { updateProduct, useAllProducts } from "@/lib/services/catalog-service";
import { HOME_SECTION_LABELS, type HomeContent } from "@/types/home-content";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { errorMessage } from "@/lib/api/client";
import { toast } from "@/store/toast-store";

function Block({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg text-ink">{title}</h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="shrink-0 text-muted hover:text-error">
      <Trash2 size={16} />
    </button>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} className="self-start">
      <Plus size={14} />
      {label}
    </Button>
  );
}

const newId = () => crypto.randomUUID();

export default function HomePageEditor() {
  const stored = useHomeContent();
  const products = useAllProducts();
  const [draft, setDraft] = useState<HomeContent>(stored);
  const [synced, setSynced] = useState<HomeContent>(stored);
  const [resetOpen, setResetOpen] = useState(false);

  // Re-sync the draft when the saved content changes (after saving, resetting, or localStorage hydration).
  if (stored !== synced) {
    setSynced(stored);
    setDraft(stored);
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(stored);

  function patch(update: (d: HomeContent) => HomeContent) {
    setDraft((d) => update(d));
  }

  function moveSection(index: number, direction: -1 | 1) {
    patch((d) => {
      const target = index + direction;
      if (target < 0 || target >= d.sections.length) return d;
      const sections = [...d.sections];
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...d, sections };
    });
  }

  async function handleSave() {
    try {
      await saveHomeContent(draft);
      toast({ title: "Home page updated", description: "Changes are live on the storefront.", variant: "success" });
    } catch (error) {
      toast({ title: "Could not save the home page", description: errorMessage(error), variant: "error" });
    }
  }

  async function handleReset() {
    try {
      await resetHomeContent();
      setResetOpen(false);
      toast({ title: "Home page reset to defaults" });
    } catch (error) {
      toast({ title: "Could not reset the home page", description: errorMessage(error), variant: "error" });
    }
  }

  function handleFeatured(productId: string, featured: boolean) {
    updateProduct(productId, { featured }).catch((error) =>
      toast({ title: "Could not update the product", description: errorMessage(error), variant: "error" }),
    );
  }

  const activeProducts = products.filter((p) => p.status === "active");

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-ivory/90 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <div>
          <h1 className="text-2xl text-ink sm:text-3xl">Home Page</h1>
          <p className="text-sm text-muted">
            {dirty ? "You have unsaved changes." : "Everything shown on the storefront home page."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="inline-flex h-9 items-center gap-1.5 px-3 text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            <ExternalLink size={14} />
            View page
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setResetOpen(true)}>
            <RotateCcw size={14} />
            Reset
          </Button>
          <Button variant="primary" size="sm" disabled={!dirty} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>

      <Block title="Hero" description="The large banner at the top of the page.">
        <Input label="Small heading above" value={draft.hero.eyebrow} onChange={(e) => patch((d) => ({ ...d, hero: { ...d.hero, eyebrow: e.target.value } }))} />
        <Input label="Main heading" value={draft.hero.heading} onChange={(e) => patch((d) => ({ ...d, hero: { ...d.hero, heading: e.target.value } }))} />
        <Textarea label="Description" value={draft.hero.body} onChange={(e) => patch((d) => ({ ...d, hero: { ...d.hero, body: e.target.value } }))} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Button text" value={draft.hero.ctaLabel} onChange={(e) => patch((d) => ({ ...d, hero: { ...d.hero, ctaLabel: e.target.value } }))} hint="Leave empty to hide the button" />
          <Input label="Button link" value={draft.hero.ctaHref} onChange={(e) => patch((d) => ({ ...d, hero: { ...d.hero, ctaHref: e.target.value } }))} hint="For example /shop or /shop/rings" />
        </div>
      </Block>

      <Block title="Sections" description="Show, hide, and reorder the sections below the hero.">
        <ul className="flex flex-col divide-y divide-border rounded-(--radius-md) border border-border">
          {draft.sections.map((section, i) => (
            <li key={section.id} className="flex items-center gap-3 px-4 py-3">
              <label className="flex flex-1 cursor-pointer items-center gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={section.visible}
                  onChange={(e) =>
                    patch((d) => ({
                      ...d,
                      sections: d.sections.map((s) => (s.id === section.id ? { ...s, visible: e.target.checked } : s)),
                    }))
                  }
                  className="h-4 w-4 accent-gold"
                />
                {HOME_SECTION_LABELS[section.id]}
              </label>
              <button type="button" aria-label={`Move ${HOME_SECTION_LABELS[section.id]} up`} disabled={i === 0} onClick={() => moveSection(i, -1)} className="text-muted hover:text-ink disabled:opacity-30">
                <ArrowUp size={16} />
              </button>
              <button type="button" aria-label={`Move ${HOME_SECTION_LABELS[section.id]} down`} disabled={i === draft.sections.length - 1} onClick={() => moveSection(i, 1)} className="text-muted hover:text-ink disabled:opacity-30">
                <ArrowDown size={16} />
              </button>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Categories heading" value={draft.categoriesHeading} onChange={(e) => patch((d) => ({ ...d, categoriesHeading: e.target.value }))} />
          <Input label="Bestsellers heading" value={draft.bestsellersHeading} onChange={(e) => patch((d) => ({ ...d, bestsellersHeading: e.target.value }))} />
        </div>
      </Block>

      <Block title="Bestsellers" description="Tick the products to feature. These apply immediately, like any product edit.">
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {activeProducts.map((product) => (
            <li key={product.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-(--radius-sm) border border-border px-3 py-2.5 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={!!product.featured}
                  onChange={(e) => handleFeatured(product.id, e.target.checked)}
                  className="h-4 w-4 accent-gold"
                />
                {product.name}
              </label>
            </li>
          ))}
        </ul>
      </Block>

      <Block
        title="Sold Out Showcase"
        description="Products that sell out are hidden from the shop and shown here instead, so customers can see what you have already sold. It fills in automatically."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Small heading above" value={draft.sold.eyebrow} onChange={(e) => patch((d) => ({ ...d, sold: { ...d.sold, eyebrow: e.target.value } }))} />
          <Input label="Heading" value={draft.sold.heading} onChange={(e) => patch((d) => ({ ...d, sold: { ...d.sold, heading: e.target.value } }))} />
        </div>
        <Textarea label="Description" rows={2} value={draft.sold.description} onChange={(e) => patch((d) => ({ ...d, sold: { ...d.sold, description: e.target.value } }))} />
      </Block>

      <Block title="Why Aura Jewels" description="Your points of difference.">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Small heading above" value={draft.why.eyebrow} onChange={(e) => patch((d) => ({ ...d, why: { ...d.why, eyebrow: e.target.value } }))} />
          <Input label="Heading" value={draft.why.heading} onChange={(e) => patch((d) => ({ ...d, why: { ...d.why, heading: e.target.value } }))} />
        </div>
        {draft.why.points.map((point) => (
          <div key={point.id} className="flex items-start gap-3 rounded-(--radius-md) border border-border p-4">
            <div className="flex flex-1 flex-col gap-4">
              <Input label="Title" value={point.title} onChange={(e) => patch((d) => ({ ...d, why: { ...d.why, points: d.why.points.map((p) => (p.id === point.id ? { ...p, title: e.target.value } : p)) } }))} />
              <Textarea label="Description" rows={2} value={point.description} onChange={(e) => patch((d) => ({ ...d, why: { ...d.why, points: d.why.points.map((p) => (p.id === point.id ? { ...p, description: e.target.value } : p)) } }))} />
            </div>
            <RemoveButton label={`Remove ${point.title}`} onClick={() => patch((d) => ({ ...d, why: { ...d.why, points: d.why.points.filter((p) => p.id !== point.id) } }))} />
          </div>
        ))}
        <AddButton label="Add point" onClick={() => patch((d) => ({ ...d, why: { ...d.why, points: [...d.why.points, { id: newId(), title: "", description: "" }] } }))} />
      </Block>

      <Block title="Customer Feedback" description="Testimonials shown on the home page.">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Small heading above" value={draft.testimonials.eyebrow} onChange={(e) => patch((d) => ({ ...d, testimonials: { ...d.testimonials, eyebrow: e.target.value } }))} />
          <Input label="Heading" value={draft.testimonials.heading} onChange={(e) => patch((d) => ({ ...d, testimonials: { ...d.testimonials, heading: e.target.value } }))} />
        </div>
        {draft.testimonials.items.map((item) => {
          const setItem = (change: Partial<typeof item>) =>
            patch((d) => ({ ...d, testimonials: { ...d.testimonials, items: d.testimonials.items.map((t) => (t.id === item.id ? { ...t, ...change } : t)) } }));
          return (
            <div key={item.id} className="flex items-start gap-3 rounded-(--radius-md) border border-border p-4">
              <div className="flex flex-1 flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Input label="Name" value={item.name} onChange={(e) => setItem({ name: e.target.value })} />
                  <Input label="City" value={item.city} onChange={(e) => setItem({ city: e.target.value })} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-ink">Rating</label>
                    <select value={item.rating} onChange={(e) => setItem({ rating: Number(e.target.value) })} className="h-12 rounded-(--radius-sm) border border-border bg-surface px-4 text-base text-ink focus:border-gold focus:outline-none">
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>{n} stars</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Textarea label="Quote" value={item.quote} onChange={(e) => setItem({ quote: e.target.value })} />
              </div>
              <RemoveButton label={`Remove testimonial from ${item.name}`} onClick={() => patch((d) => ({ ...d, testimonials: { ...d.testimonials, items: d.testimonials.items.filter((t) => t.id !== item.id) } }))} />
            </div>
          );
        })}
        <AddButton label="Add testimonial" onClick={() => patch((d) => ({ ...d, testimonials: { ...d.testimonials, items: [...d.testimonials.items, { id: newId(), name: "", city: "", rating: 5, quote: "" }] } }))} />
      </Block>

      <Block title="Social Feed" description="Your social channels and the post tiles shown on the home page.">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Small heading above" value={draft.social.eyebrow} onChange={(e) => patch((d) => ({ ...d, social: { ...d.social, eyebrow: e.target.value } }))} />
          <Input label="Handle" value={draft.social.handle} onChange={(e) => patch((d) => ({ ...d, social: { ...d.social, handle: e.target.value } }))} />
        </div>
        <Textarea label="Description" rows={2} value={draft.social.description} onChange={(e) => patch((d) => ({ ...d, social: { ...d.social, description: e.target.value } }))} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Input label="Instagram link" value={draft.social.instagramUrl} onChange={(e) => patch((d) => ({ ...d, social: { ...d.social, instagramUrl: e.target.value } }))} />
          <Input label="TikTok link" value={draft.social.tiktokUrl} onChange={(e) => patch((d) => ({ ...d, social: { ...d.social, tiktokUrl: e.target.value } }))} />
          <Input label="Facebook link" value={draft.social.facebookUrl} onChange={(e) => patch((d) => ({ ...d, social: { ...d.social, facebookUrl: e.target.value } }))} />
        </div>
        <p className="text-xs text-muted">Post tiles use placeholder images until image uploads arrive with the backend. Each tile links to the URL you set.</p>
        {draft.social.posts.map((post) => (
          <div key={post.id} className="flex items-end gap-3">
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Caption" value={post.caption} onChange={(e) => patch((d) => ({ ...d, social: { ...d.social, posts: d.social.posts.map((p) => (p.id === post.id ? { ...p, caption: e.target.value } : p)) } }))} />
              <Input label="Post link" value={post.url} onChange={(e) => patch((d) => ({ ...d, social: { ...d.social, posts: d.social.posts.map((p) => (p.id === post.id ? { ...p, url: e.target.value } : p)) } }))} />
            </div>
            <div className="pb-3.5">
              <RemoveButton label={`Remove post ${post.caption}`} onClick={() => patch((d) => ({ ...d, social: { ...d.social, posts: d.social.posts.filter((p) => p.id !== post.id) } }))} />
            </div>
          </div>
        ))}
        <AddButton label="Add post" onClick={() => patch((d) => ({ ...d, social: { ...d.social, posts: [...d.social.posts, { id: newId(), caption: "", url: d.social.instagramUrl }] } }))} />
      </Block>

      <Block title="Trust Strip" description="The short reassurance points near the bottom of the page.">
        {draft.trustPoints.map((point) => (
          <div key={point.id} className="flex items-end gap-3">
            <div className="flex-1">
              <Input label="Text" value={point.label} onChange={(e) => patch((d) => ({ ...d, trustPoints: d.trustPoints.map((t) => (t.id === point.id ? { ...t, label: e.target.value } : t)) }))} />
            </div>
            <div className="pb-3.5">
              <RemoveButton label={`Remove ${point.label}`} onClick={() => patch((d) => ({ ...d, trustPoints: d.trustPoints.filter((t) => t.id !== point.id) }))} />
            </div>
          </div>
        ))}
        <AddButton label="Add point" onClick={() => patch((d) => ({ ...d, trustPoints: [...d.trustPoints, { id: newId(), label: "" }] }))} />
      </Block>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset home page?">
        <p className="text-sm text-muted">This restores the original home page text and layout. Your featured products are not changed.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setResetOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleReset}>Reset to defaults</Button>
        </div>
      </Modal>
    </div>
  );
}
