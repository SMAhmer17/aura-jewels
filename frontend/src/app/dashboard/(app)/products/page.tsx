"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Star, Upload } from "lucide-react";
import {
  useAllProducts,
  useCategories,
  useCategoryById,
  addProduct,
  updateProduct,
  removeProduct,
  isSoldOut,
} from "@/lib/services/catalog-service";
import { useSettings } from "@/lib/services/settings-service";
import type { Product, ProductVariant } from "@/types/product";
import { ProductImage } from "@/components/features/product/ProductImage";
import { FilterPills, FilterSelect, ResultsBar, SearchField } from "@/components/features/dashboard/DashboardFilters";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils/currency";
import { slugify } from "@/lib/utils/slugify";
import { uploadProductImage } from "@/lib/services/uploads-service";
import { errorMessage } from "@/lib/api/client";
import { toast } from "@/store/toast-store";

interface VariantRow {
  id: string;
  size: string;
  stock: string;
  sku?: string;
}

interface FormState {
  name: string;
  slug: string;
  categoryId: string;
  price: string;
  compareAtPrice: string;
  material: string;
  description: string;
  status: Product["status"];
  featured: boolean;
  images: string[];
  variants: VariantRow[];
}

type StatusFilter = "all" | Product["status"];
type StockFilter = "all" | "in" | "low" | "sold";
type Sort = "newest" | "name" | "priceLow" | "priceHigh" | "stockLow";

const selectClass =
  "h-12 rounded-(--radius-sm) border border-border bg-surface px-4 text-base text-ink focus:border-gold focus:outline-none";

function CategoryName({ categoryId }: { categoryId: string }) {
  const category = useCategoryById(categoryId);
  return <span>{category?.name ?? "Uncategorized"}</span>;
}

const MAX_IMAGES = 8;
const MIN_IMAGES = 3;

const newVariantRow = (): VariantRow => ({ id: crypto.randomUUID(), size: "", stock: "0" });

export default function ProductsPage() {
  const products = useAllProducts();
  const categories = useCategories();
  const { lowStockThreshold } = useSettings();
  const threshold = lowStockThreshold ?? 5;

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("newest");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const blankForm = (): FormState => ({
    name: "",
    slug: "",
    categoryId: categories[0]?.id ?? "",
    price: "",
    compareAtPrice: "",
    material: "",
    description: "",
    status: "active",
    featured: false,
    images: [],
    variants: [{ id: crypto.randomUUID(), size: "One Size", stock: "10" }],
  });
  const [form, setForm] = useState<FormState>(blankForm);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalStock = (p: Product) => p.variants.reduce((sum, v) => sum + v.stock, 0);
  const isLow = (p: Product) => !isSoldOut(p) && p.variants.some((v) => v.stock > 0 && v.stock <= threshold);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = products.filter((p) => {
      if (categoryFilter !== "all" && p.categoryId !== categoryFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (onSaleOnly && !(p.compareAtPrice && p.compareAtPrice > p.price)) return false;
      if (stockFilter === "sold" && !isSoldOut(p)) return false;
      if (stockFilter === "low" && !(!isSoldOut(p) && p.variants.some((v) => v.stock > 0 && v.stock <= threshold))) return false;
      if (stockFilter === "in" && isSoldOut(p)) return false;
      return !term || `${p.name} ${p.material} ${p.variants.map((v) => v.sku).join(" ")}`.toLowerCase().includes(term);
    });
    return list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "priceLow") return a.price - b.price;
      if (sort === "priceHigh") return b.price - a.price;
      if (sort === "stockLow") return a.variants.reduce((s, v) => s + v.stock, 0) - b.variants.reduce((s, v) => s + v.stock, 0);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [products, query, categoryFilter, statusFilter, stockFilter, onSaleOnly, sort, threshold]);

  const filtersActive = query !== "" || categoryFilter !== "all" || statusFilter !== "all" || stockFilter !== "all" || onSaleOnly;
  function clearFilters() {
    setQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setStockFilter("all");
    setOnSaleOnly(false);
  }

  function openAddModal() {
    setEditingProduct(null);
    setForm(blankForm());
    setModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      slug: product.slug,
      categoryId: product.categoryId,
      price: String(product.price),
      compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
      material: product.material,
      description: product.description,
      status: product.status,
      featured: !!product.featured,
      images: product.images ?? [],
      variants: product.variants.map((v) => ({ id: v.id, size: v.size, stock: String(v.stock), sku: v.sku })),
    });
    setModalOpen(true);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = MAX_IMAGES - form.images.length;
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, Math.max(0, room));
    if (files.length > picked.length) {
      toast({ title: `Up to ${MAX_IMAGES} images per product`, description: "Extra files were skipped." });
    }
    if (picked.length === 0) return;
    setUploading(true);
    try {
      const urls = await Promise.all(picked.map((f) => uploadProductImage(f)));
      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls].slice(0, MAX_IMAGES) }));
    } catch (error) {
      toast({ title: "Could not upload the images", description: errorMessage(error, "Check the files and try again."), variant: "error" });
    } finally {
      setUploading(false);
    }
  }

  function addImageUrl() {
    const url = imageUrl.trim();
    if (!/^(https?:\/\/|\/)/.test(url)) {
      toast({ title: "Enter a full image link starting with https://", variant: "error" });
      return;
    }
    if (form.images.length >= MAX_IMAGES) {
      toast({ title: `Up to ${MAX_IMAGES} images per product` });
      return;
    }
    setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
    setImageUrl("");
  }

  function makeCover(index: number) {
    setForm((prev) => {
      const images = [...prev.images];
      const [picked] = images.splice(index, 1);
      return { ...prev, images: [picked, ...images] };
    });
  }

  function updateVariant(id: string, change: Partial<VariantRow>) {
    setForm((prev) => ({ ...prev, variants: prev.variants.map((v) => (v.id === id ? { ...v, ...change } : v)) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(form.price);
    if (!form.name.trim() || !form.categoryId || Number.isNaN(price) || saving) return;

    // Every published product needs at least 3 images. Older products that still use
    // placeholder images (none uploaded yet) can be edited without being blocked.
    const usesPlaceholders = !!editingProduct && !(editingProduct.images && editingProduct.images.length > 0);
    if (form.status === "active" && form.images.length < MIN_IMAGES && !usesPlaceholders) {
      toast({
        title: `Add at least ${MIN_IMAGES} images`,
        description: `This product has ${form.images.length}. Upload more, or save it as a draft for now.`,
        variant: "error",
      });
      return;
    }

    const rows = form.variants.filter((v) => v.size.trim());
    if (rows.length === 0) {
      toast({ title: "Add at least one size or option", variant: "error" });
      return;
    }
    const slug = form.slug || slugify(form.name);
    const variants: ProductVariant[] = rows.map((v) => ({
      id: v.id,
      size: v.size.trim(),
      stock: Math.max(0, Math.floor(Number(v.stock)) || 0),
      sku: v.sku ?? `${slugify(form.name).toUpperCase()}-${slugify(v.size).toUpperCase()}`,
    }));
    const compareAt = Number(form.compareAtPrice);
    const compareAtPrice = compareAt > price ? compareAt : undefined;

    const base = {
      name: form.name,
      slug,
      categoryId: form.categoryId,
      price,
      compareAtPrice,
      material: form.material,
      description: form.description,
      status: form.status,
      featured: form.featured,
      images: form.images,
      variants,
    };

    setSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, base);
        toast({ title: "Product updated", description: form.name, variant: "success" });
      } else {
        await addProduct(base);
        toast({ title: "Product added", description: `${form.name} now appears on the storefront`, variant: "success" });
      }
      setModalOpen(false);
    } catch (error) {
      toast({ title: "Could not save the product", description: errorMessage(error), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await removeProduct(deleteTarget.id);
      toast({ title: "Product removed", description: deleteTarget.name });
      setDeleteTarget(null);
    } catch (error) {
      toast({ title: "Could not remove the product", description: errorMessage(error), variant: "error" });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-ink sm:text-3xl">Products</h1>
          <p className="text-sm text-muted">{products.length} total products. Sold out products leave the shop and appear in the Sold section.</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus size={16} />
          Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState title="No products yet" description="Add your first product to start selling." action={<Button onClick={openAddModal}>Add Product</Button>} />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            <FilterPills
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { id: "all", label: "All" },
                { id: "active", label: "Active" },
                { id: "draft", label: "Draft" },
                { id: "archived", label: "Archived" },
              ]}
            />
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
              <SearchField value={query} onChange={setQuery} placeholder="Search name, material, SKU" label="Search products" className="lg:w-72" />
              <FilterSelect
                label="Category"
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={[{ id: "all", label: "All" }, ...categories.map((c) => ({ id: c.id, label: c.name }))]}
              />
              <FilterSelect
                label="Stock"
                value={stockFilter}
                onChange={setStockFilter}
                options={[
                  { id: "all", label: "All" },
                  { id: "in", label: "In stock" },
                  { id: "low", label: "Low stock" },
                  { id: "sold", label: "Sold out" },
                ]}
              />
              <FilterSelect
                label="Sort"
                value={sort}
                onChange={setSort}
                options={[
                  { id: "newest", label: "Newest" },
                  { id: "name", label: "Name A to Z" },
                  { id: "priceLow", label: "Price low to high" },
                  { id: "priceHigh", label: "Price high to low" },
                  { id: "stockLow", label: "Lowest stock" },
                ]}
              />
              <label className="flex h-11 cursor-pointer items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={onSaleOnly} onChange={(e) => setOnSaleOnly(e.target.checked)} className="h-4 w-4 accent-gold" />
                On sale only
              </label>
            </div>
            <ResultsBar shown={visible.length} total={products.length} active={filtersActive} onClear={clearFilters} />
          </div>

          {visible.length === 0 ? (
            <EmptyState title="No matching products" description="Try different filters." />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Product</TableHeaderCell>
                  <TableHeaderCell>Category</TableHeaderCell>
                  <TableHeaderCell>Price</TableHeaderCell>
                  <TableHeaderCell>Stock</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-(--radius-sm) border border-border">
                          <ProductImage id={product.id} images={product.images} alt="" className="h-full w-full" />
                        </div>
                        <span className="flex items-center gap-1.5">
                          {product.name}
                          {product.featured && <Star size={13} className="fill-gold text-gold" aria-label="Featured" />}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted"><CategoryName categoryId={product.categoryId} /></TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatPrice(product.price)}</span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="text-xs text-muted line-through">{formatPrice(product.compareAtPrice)}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{totalStock(product)}</span>
                        {isSoldOut(product) ? <Badge variant="error">Sold out</Badge> : isLow(product) ? <Badge variant="gold">Low</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.status === "active" ? "success" : "neutral"}>{product.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => openEditModal(product)} aria-label={`Edit ${product.name}`} className="text-muted hover:text-ink">
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(product)} aria-label={`Delete ${product.name}`} className="text-muted hover:text-error">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? "Edit Product" : "Add Product"} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value, slug: editingProduct ? prev.slug : slugify(e.target.value) }))}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="product-category" className="text-sm font-medium text-ink">Category</label>
            <select id="product-category" required value={form.categoryId} onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))} className={selectClass}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Price (PKR)" type="number" required min="0" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} />
            <Input
              label="Original price (optional)"
              type="number"
              min="0"
              value={form.compareAtPrice}
              onChange={(e) => setForm((prev) => ({ ...prev, compareAtPrice: e.target.value }))}
              hint="Higher than the price to run a sale. Shows a Sale badge and strikethrough."
            />
          </div>
          <Input label="Material" value={form.material} onChange={(e) => setForm((prev) => ({ ...prev, material: e.target.value }))} />
          <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />

          <div className="flex flex-col gap-3 rounded-(--radius-md) border border-border p-4">
            <div>
              <span className="text-sm font-medium text-ink">Product images</span>
              <p className="text-xs text-muted">
                The first image is the cover (thumbnail) shown on cards and lists. At least {MIN_IMAGES} images are required, up to {MAX_IMAGES}. Photos are resized and uploaded when you choose them.
              </p>
            </div>
            {form.images.length > 0 && (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {form.images.map((src, i) => (
                  <li key={`${i}-${src.slice(-24)}`} className="flex flex-col gap-1.5">
                    <div className={`relative aspect-square overflow-hidden rounded-(--radius-sm) border ${i === 0 ? "border-gold ring-1 ring-gold" : "border-border"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Product image ${i + 1}`} className="h-full w-full object-cover" />
                      {i === 0 && <Badge variant="gold" className="absolute left-1 top-1 bg-ivory">Cover</Badge>}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      {i === 0 ? (
                        <span className="text-muted">Thumbnail</span>
                      ) : (
                        <button type="button" onClick={() => makeCover(i)} className="text-ink underline underline-offset-4 hover:text-gold">
                          Set as cover
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={`Remove image ${i + 1}`}
                        onClick={() => setForm((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                        className="text-muted hover:text-error"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-(--radius-sm) border border-gold px-4 text-sm text-ink transition-colors hover:bg-gold/10 focus-within:ring-2 focus-within:ring-gold">
                <Upload size={14} />
                {uploading ? "Uploading..." : "Upload images"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading || form.images.length >= MAX_IMAGES}
                  className="sr-only"
                  data-testid="product-image-input"
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              <span className={`text-xs ${form.images.length < MIN_IMAGES ? "text-error" : "text-muted"}`}>
                {form.images.length} of {MAX_IMAGES} added (minimum {MIN_IMAGES})
              </span>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input label="Or add an image link" placeholder="https://" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              </div>
              <Button type="button" variant="outline" size="md" onClick={addImageUrl}>Add</Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-(--radius-md) border border-border p-4">
            <div>
              <span className="text-sm font-medium text-ink">Sizes or options and stock</span>
              <p className="text-xs text-muted">For example ring sizes, or colours for boxes. Stock at zero for every row marks the product sold out.</p>
            </div>
            {form.variants.map((row) => (
              <div key={row.id} className="flex items-end gap-3">
                <div className="flex-1">
                  <Input label="Size or option" value={row.size} onChange={(e) => updateVariant(row.id, { size: e.target.value })} />
                </div>
                <div className="w-28">
                  <Input label="Stock" type="number" min="0" value={row.stock} onChange={(e) => updateVariant(row.id, { stock: e.target.value })} />
                </div>
                <button
                  type="button"
                  aria-label="Remove row"
                  disabled={form.variants.length === 1}
                  onClick={() => setForm((prev) => ({ ...prev, variants: prev.variants.filter((v) => v.id !== row.id) }))}
                  className="pb-3.5 text-muted hover:text-error disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setForm((prev) => ({ ...prev, variants: [...prev.variants, newVariantRow()] }))}>
              <Plus size={14} />
              Add size or option
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="product-status" className="text-sm font-medium text-ink">Status</label>
              <select id="product-status" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as Product["status"] }))} className={selectClass}>
                <option value="active">Active (visible on storefront)</option>
                <option value="draft">Draft (hidden)</option>
                <option value="archived">Archived (hidden)</option>
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-3 self-end pb-3 text-sm text-ink">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))} className="h-4 w-4 accent-gold" />
              Feature in Bestsellers on the home page
            </label>
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || uploading}>{saving ? "Saving..." : editingProduct ? "Save Changes" : "Add Product"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete product?">
        <p className="text-sm text-muted">
          <span className="text-ink">{deleteTarget?.name}</span> will be permanently removed. This can&apos;t be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="primary" onClick={confirmDelete}>Delete Product</Button>
        </div>
      </Modal>
    </div>
  );
}
