"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  useDiscounts,
  addDiscount,
  updateDiscount,
  removeDiscount,
  getDiscountState,
  type DiscountState,
} from "@/lib/services/discounts-service";
import type { Discount, DiscountType } from "@/types/discount";
import { FilterPills, ResultsBar, SearchField } from "@/components/features/dashboard/DashboardFilters";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils/currency";
import { toast } from "@/store/toast-store";
import { errorMessage } from "@/lib/api/client";

interface FormState {
  code: string;
  type: DiscountType;
  value: string;
  usageLimit: string;
  minOrderAmount: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
}

const emptyForm: FormState = { code: "", type: "percentage", value: "", usageLimit: "", minOrderAmount: "", startsAt: "", endsAt: "", active: true };

const stateVariant: Record<DiscountState, "success" | "neutral" | "gold" | "error"> = {
  active: "success",
  inactive: "neutral",
  scheduled: "gold",
  expired: "error",
  "used up": "error",
};

type StateFilter = "all" | DiscountState;

export default function DiscountsPage() {
  const discounts = useDiscounts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");

  const rows = useMemo(() => discounts.map((d) => ({ discount: d, state: getDiscountState(d) })), [discounts]);
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter(({ discount, state }) => (stateFilter === "all" || state === stateFilter) && (!term || discount.code.toLowerCase().includes(term)));
  }, [rows, query, stateFilter]);

  const count = (s: DiscountState) => rows.filter((r) => r.state === s).length;
  const filtersActive = query !== "" || stateFilter !== "all";

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(d: Discount) {
    setEditingId(d.id);
    setForm({
      code: d.code,
      type: d.type,
      value: String(d.value),
      usageLimit: d.usageLimit === null ? "" : String(d.usageLimit),
      minOrderAmount: d.minOrderAmount ? String(d.minOrderAmount) : "",
      startsAt: d.startsAt ?? "",
      endsAt: d.endsAt ?? "",
      active: d.active,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(form.value);
    if (!form.code.trim() || Number.isNaN(value) || saving) return;
    if (form.startsAt && form.endsAt && form.endsAt < form.startsAt) {
      toast({ title: "End date must be after the start date", variant: "error" });
      return;
    }
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value,
      usageLimit: form.usageLimit.trim() === "" ? null : Number(form.usageLimit),
      minOrderAmount: form.minOrderAmount.trim() === "" ? null : Number(form.minOrderAmount),
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      active: form.active,
    };
    setSaving(true);
    try {
      if (editingId) {
        await updateDiscount(editingId, payload);
        toast({ title: "Discount updated", description: payload.code, variant: "success" });
      } else {
        await addDiscount(payload);
        toast({ title: "Discount created", description: payload.code, variant: "success" });
      }
      setModalOpen(false);
    } catch (error) {
      toast({ title: "Could not save the discount", description: errorMessage(error), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await removeDiscount(deleteTarget.id);
      toast({ title: "Discount removed", description: deleteTarget.code });
      setDeleteTarget(null);
    } catch (error) {
      toast({ title: "Could not remove the discount", description: errorMessage(error), variant: "error" });
    }
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
        <EmptyState title="No discounts yet" description="Create a code to offer customers a discount at checkout." action={<Button onClick={openAddModal}>Add Discount</Button>} />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            <FilterPills
              label="Discount status"
              value={stateFilter}
              onChange={setStateFilter}
              options={[
                { id: "all", label: `All (${rows.length})` },
                { id: "active", label: `Active (${count("active")})` },
                { id: "scheduled", label: `Scheduled (${count("scheduled")})` },
                { id: "expired", label: `Expired (${count("expired")})` },
                { id: "used up", label: `Used up (${count("used up")})` },
                { id: "inactive", label: `Inactive (${count("inactive")})` },
              ]}
            />
            <SearchField value={query} onChange={setQuery} placeholder="Search codes" label="Search discounts" className="sm:w-72" />
            <ResultsBar shown={visible.length} total={rows.length} active={filtersActive} onClear={() => { setQuery(""); setStateFilter("all"); }} />
          </div>

          {visible.length === 0 ? (
            <EmptyState title="No matching discounts" description="Try a different filter." />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Code</TableHeaderCell>
                  <TableHeaderCell>Value</TableHeaderCell>
                  <TableHeaderCell>Rules</TableHeaderCell>
                  <TableHeaderCell>Usage</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map(({ discount, state }) => (
                  <TableRow key={discount.id}>
                    <TableCell>{discount.code}</TableCell>
                    <TableCell>{discount.type === "percentage" ? `${discount.value}%` : formatPrice(discount.value)}</TableCell>
                    <TableCell className="text-xs text-muted">
                      <div className="flex flex-col">
                        {discount.minOrderAmount ? <span>Min order {formatPrice(discount.minOrderAmount)}</span> : <span>No minimum</span>}
                        <span>
                          {discount.startsAt || discount.endsAt
                            ? `${discount.startsAt ?? "Any time"} to ${discount.endsAt ?? "No end"}`
                            : "No date limit"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted">
                      {discount.usedCount}
                      {discount.usageLimit !== null ? ` / ${discount.usageLimit}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={stateVariant[state]} className="capitalize">{state}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => openEditModal(discount)} aria-label={`Edit ${discount.code}`} className="text-muted hover:text-ink">
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(discount)} aria-label={`Delete ${discount.code}`} className="text-muted hover:text-error">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Discount" : "Add Discount"} className="max-w-lg">
        <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <Input label="Code" required value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="discount-type" className="text-sm font-medium text-ink">Type</label>
            <select
              id="discount-type"
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as DiscountType }))}
              className="h-12 rounded-(--radius-sm) border border-border bg-surface px-4 text-base text-ink focus:border-gold focus:outline-none"
            >
              <option value="percentage">Percentage off</option>
              <option value="fixed">Fixed amount off (PKR)</option>
            </select>
          </div>
          <Input label={form.type === "percentage" ? "Percentage (%)" : "Amount (PKR)"} type="number" required min="0" value={form.value} onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))} />
          <Input label="Minimum order (PKR, optional)" type="number" min="0" value={form.minOrderAmount} onChange={(e) => setForm((prev) => ({ ...prev, minOrderAmount: e.target.value }))} hint="The order subtotal must reach this amount" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Starts (optional)" type="date" value={form.startsAt} onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))} />
            <Input label="Ends (optional)" type="date" value={form.endsAt} onChange={(e) => setForm((prev) => ({ ...prev, endsAt: e.target.value }))} />
          </div>
          <Input label="Usage limit (optional)" type="number" min="0" value={form.usageLimit} onChange={(e) => setForm((prev) => ({ ...prev, usageLimit: e.target.value }))} hint="Leave blank for unlimited uses" />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} className="h-4 w-4 accent-gold" />
            Active
          </label>
          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Save Changes" : "Add Discount"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete discount?">
        <p className="text-sm text-muted">
          <span className="text-ink">{deleteTarget?.code}</span> will no longer work at checkout.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="primary" onClick={confirmDelete}>Delete Discount</Button>
        </div>
      </Modal>
    </div>
  );
}
