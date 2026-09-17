"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  useDiscounts,
  addDiscount,
  updateDiscount,
  removeDiscount,
} from "@/lib/services/discounts-service";
import type { Discount, DiscountType } from "@/types/discount";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/store/toast-store";

interface FormState {
  code: string;
  type: DiscountType;
  value: string;
  usageLimit: string;
  active: boolean;
}

const emptyForm: FormState = { code: "", type: "percentage", value: "", usageLimit: "", active: true };

export default function DiscountsPage() {
  const discounts = useDiscounts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(discount: Discount) {
    setEditingId(discount.id);
    setForm({
      code: discount.code,
      type: discount.type,
      value: String(discount.value),
      usageLimit: discount.usageLimit === null ? "" : String(discount.usageLimit),
      active: discount.active,
    });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(form.value);
    if (!form.code.trim() || Number.isNaN(value)) return;
    const usageLimit = form.usageLimit.trim() === "" ? null : Number(form.usageLimit);

    if (editingId) {
      updateDiscount(editingId, {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value,
        usageLimit,
        active: form.active,
      });
      toast({ title: "Discount updated", description: form.code, variant: "success" });
    } else {
      addDiscount({
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value,
        usageLimit,
        active: form.active,
      });
      toast({ title: "Discount created", description: form.code, variant: "success" });
    }
    setModalOpen(false);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    removeDiscount(deleteTarget.id);
    toast({ title: "Discount removed", description: deleteTarget.code });
    setDeleteTarget(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-ink sm:text-3xl">Discounts</h1>
          <p className="text-sm text-muted">Promo codes customers can apply at checkout.</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus size={16} />
          Add Discount
        </Button>
      </div>

      {discounts.length === 0 ? (
        <EmptyState
          title="No discounts yet"
          description="Create a code to offer customers a discount at checkout."
          action={<Button onClick={openAddModal}>Add Discount</Button>}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Code</TableHeaderCell>
              <TableHeaderCell>Value</TableHeaderCell>
              <TableHeaderCell>Usage</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {discounts.map((discount) => (
              <TableRow key={discount.id}>
                <TableCell>{discount.code}</TableCell>
                <TableCell>
                  {discount.type === "percentage" ? `${discount.value}%` : `Rs. ${discount.value}`}
                </TableCell>
                <TableCell className="text-muted">
                  {discount.usedCount}
                  {discount.usageLimit !== null ? ` / ${discount.usageLimit}` : ""}
                </TableCell>
                <TableCell>
                  <Badge variant={discount.active ? "success" : "neutral"}>
                    {discount.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(discount)}
                      aria-label={`Edit ${discount.code}`}
                      className="text-muted hover:text-ink"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(discount)}
                      aria-label={`Delete ${discount.code}`}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Discount" : "Add Discount"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Code"
            required
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as DiscountType }))}
              className="h-12 rounded-(--radius-sm) border border-border bg-surface px-4 text-base text-ink focus:border-gold focus:outline-none"
            >
              <option value="percentage">Percentage off</option>
              <option value="fixed">Fixed amount off (PKR)</option>
            </select>
          </div>
          <Input
            label={form.type === "percentage" ? "Percentage (%)" : "Amount (PKR)"}
            type="number"
            required
            min="0"
            value={form.value}
            onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
          />
          <Input
            label="Usage Limit (optional)"
            type="number"
            min="0"
            value={form.usageLimit}
            onChange={(e) => setForm((prev) => ({ ...prev, usageLimit: e.target.value }))}
            hint="Leave blank for unlimited uses"
          />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
              className="h-4 w-4 accent-gold"
            />
            Active
          </label>
          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingId ? "Save Changes" : "Add Discount"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete discount?">
        <p className="text-sm text-muted">
          <span className="text-ink">{deleteTarget?.code}</span> will no longer work at checkout.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmDelete}>
            Delete Discount
          </Button>
        </div>
      </Modal>
    </div>
  );
}
