"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  useCategories,
  addCategory,
  updateCategory,
  removeCategory,
  useAllProducts,
} from "@/lib/services/catalog-service";
import type { Category } from "@/types/category";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/store/toast-store";
import { errorMessage } from "@/lib/api/client";
import { slugify } from "@/lib/utils/slugify";

interface FormState {
  name: string;
  slug: string;
  description: string;
}

const emptyForm: FormState = { name: "", slug: "", description: "" };

export default function CategoriesPage() {
  const categories = useCategories();
  const products = useAllProducts();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(category: Category) {
    setEditingId(category.id);
    setForm({ name: category.name, slug: category.slug, description: category.description ?? "" });
    setModalOpen(true);
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : slugify(name),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim() || saving) return;

    setSaving(true);
    try {
      if (editingId) {
        await updateCategory(editingId, { name: form.name, slug: form.slug, description: form.description });
        toast({ title: "Category updated", description: form.name, variant: "success" });
      } else {
        await addCategory({ name: form.name, slug: form.slug, description: form.description });
        toast({ title: "Category added", description: `${form.name} now appears on the storefront`, variant: "success" });
      }
      setModalOpen(false);
    } catch (error) {
      toast({ title: "Could not save the category", description: errorMessage(error), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await removeCategory(deleteTarget.id);
      toast({ title: "Category removed", description: deleteTarget.name });
      setDeleteTarget(null);
    } catch (error) {
      toast({ title: "Could not remove the category", description: errorMessage(error), variant: "error" });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-ink sm:text-3xl">Categories</h1>
          <p className="text-sm text-muted">
            Changes here reflect instantly on the storefront navigation and shop pages.
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus size={16} />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Add your first category to start organizing products."
          action={<Button onClick={openAddModal}>Add Category</Button>}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Slug</TableHeaderCell>
              <TableHeaderCell>Products</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell className="text-muted">/shop/{category.slug}</TableCell>
                <TableCell>{products.filter((p) => p.categoryId === category.id).length}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(category)}
                      aria-label={`Edit ${category.name}`}
                      className="text-muted hover:text-ink"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(category)}
                      aria-label={`Delete ${category.name}`}
                      className="text-muted hover:text-error"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Category" : "Add Category"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Name" required value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
          <Input
            label="Slug"
            required
            value={form.slug}
            onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
            hint="Used in the URL: /shop/your-slug"
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Save Changes" : "Add Category"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete category?">
        <p className="text-sm text-muted">
          Products in <span className="text-ink">{deleteTarget?.name}</span> will be moved to
          Uncategorized, not deleted. This can&apos;t be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmDelete}>
            Delete Category
          </Button>
        </div>
      </Modal>
    </div>
  );
}
