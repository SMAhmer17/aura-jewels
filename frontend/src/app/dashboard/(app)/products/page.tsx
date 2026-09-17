"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  useAllProducts,
  useCategories,
  useCategoryById,
  addProduct,
  updateProduct,
  removeProduct,
} from "@/lib/services/catalog-service";
import type { Product } from "@/types/product";
import { ProductImagePlaceholder } from "@/components/features/product/ProductImagePlaceholder";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils/currency";
import { slugify } from "@/lib/utils/slugify";
import { toast } from "@/store/toast-store";

interface FormState {
  name: string;
  slug: string;
  categoryId: string;
  price: string;
  material: string;
  description: string;
  status: Product["status"];
}

function CategoryName({ categoryId }: { categoryId: string }) {
  const category = useCategoryById(categoryId);
  return <span>{category?.name ?? "Uncategorized"}</span>;
}

export default function ProductsPage() {
  const products = useAllProducts();
  const categories = useCategories();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    slug: "",
    categoryId: categories[0]?.id ?? "",
    price: "",
    material: "",
    description: "",
    status: "active",
  });

  function openAddModal() {
    setEditingProduct(null);
    setForm({
      name: "",
      slug: "",
      categoryId: categories[0]?.id ?? "",
      price: "",
      material: "",
      description: "",
      status: "active",
    });
    setModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      slug: product.slug,
      categoryId: product.categoryId,
      price: String(product.price),
      material: product.material,
      description: product.description,
      status: product.status,
    });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(form.price);
    if (!form.name.trim() || !form.categoryId || Number.isNaN(price)) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: form.name,
        slug: form.slug,
        categoryId: form.categoryId,
        price,
        material: form.material,
        description: form.description,
        status: form.status,
      });
      toast({ title: "Product updated", description: form.name, variant: "success" });
    } else {
      addProduct({
        name: form.name,
        slug: form.slug || slugify(form.name),
        categoryId: form.categoryId,
        price,
        material: form.material,
        description: form.description,
        status: form.status,
        variants: [{ id: crypto.randomUUID(), size: "One Size", stock: 10, sku: slugify(form.name).toUpperCase() }],
      });
      toast({ title: "Product added", description: `${form.name} now appears on the storefront`, variant: "success" });
    }
    setModalOpen(false);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    removeProduct(deleteTarget.id);
    toast({ title: "Product removed", description: deleteTarget.name });
    setDeleteTarget(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-ink sm:text-3xl">Products</h1>
          <p className="text-sm text-muted">{products.length} total products</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus size={16} />
          Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Add your first product to start selling."
          action={<Button onClick={openAddModal}>Add Product</Button>}
        />
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
            {products.map((product) => {
              const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-(--radius-sm) border border-border">
                        <ProductImagePlaceholder id={product.id} className="h-full w-full" />
                      </div>
                      <span>{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted">
                    <CategoryName categoryId={product.categoryId} />
                  </TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>{totalStock}</TableCell>
                  <TableCell>
                    <Badge variant={product.status === "active" ? "success" : "neutral"}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        aria-label={`Edit ${product.name}`}
                        className="text-muted hover:text-ink"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(product)}
                        aria-label={`Delete ${product.name}`}
                        className="text-muted hover:text-error"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add Product"}
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                name: e.target.value,
                slug: editingProduct ? prev.slug : slugify(e.target.value),
              }))
            }
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Category</label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              className="h-12 rounded-(--radius-sm) border border-border bg-surface px-4 text-base text-ink focus:border-gold focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Price (PKR)"
            type="number"
            required
            min="0"
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
          />
          <Input
            label="Material"
            value={form.material}
            onChange={(e) => setForm((prev) => ({ ...prev, material: e.target.value }))}
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as Product["status"] }))}
              className="h-12 rounded-(--radius-sm) border border-border bg-surface px-4 text-base text-ink focus:border-gold focus:outline-none"
            >
              <option value="active">Active (visible on storefront)</option>
              <option value="draft">Draft (hidden)</option>
              <option value="archived">Archived (hidden)</option>
            </select>
          </div>
          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingProduct ? "Save Changes" : "Add Product"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete product?">
        <p className="text-sm text-muted">
          <span className="text-ink">{deleteTarget?.name}</span> will be permanently removed. This
          can&apos;t be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmDelete}>
            Delete Product
          </Button>
        </div>
      </Modal>
    </div>
  );
}
