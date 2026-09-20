"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Search } from "lucide-react";
import { setVariantStock, useAllProducts, useCategoryById } from "@/lib/services/catalog-service";
import { useSettings } from "@/lib/services/settings-service";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/store/toast-store";
import { errorMessage } from "@/lib/api/client";

type Filter = "all" | "low" | "sold";

function CategoryName({ categoryId }: { categoryId: string }) {
  const category = useCategoryById(categoryId);
  return <span>{category?.name ?? "Uncategorized"}</span>;
}

/** Saves a stock change. The number updates on screen at once; if the API refuses, the list is reloaded and the admin is told. */
function saveStock(productId: string, variantId: string, stock: number) {
  setVariantStock(productId, variantId, stock).catch((error) =>
    toast({ title: "Could not update stock", description: errorMessage(error), variant: "error" }),
  );
}

function StockControl({ productId, variantId, stock }: { productId: string; variantId: string; stock: number }) {
  const commit = (value: string) => saveStock(productId, variantId, Number(value));
  const buttonClass = "flex h-9 w-9 items-center justify-center rounded-(--radius-sm) border border-border text-ink hover:border-ink disabled:opacity-30";

  return (
    <div className="flex items-center gap-1.5">
      <button type="button" aria-label="Decrease stock" disabled={stock <= 0} onClick={() => saveStock(productId, variantId, stock - 1)} className={buttonClass}>
        <Minus size={14} />
      </button>
      <input
        type="number"
        min="0"
        defaultValue={stock}
        aria-label="Stock quantity"
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="h-9 w-16 rounded-(--radius-sm) border border-border bg-surface px-2 text-center text-sm text-ink focus:border-gold focus:outline-none"
      />
      <button type="button" aria-label="Increase stock" onClick={() => saveStock(productId, variantId, stock + 1)} className={buttonClass}>
        <Plus size={14} />
      </button>
    </div>
  );
}

export default function InventoryPage() {
  const products = useAllProducts();
  const { lowStockThreshold } = useSettings();
  const threshold = lowStockThreshold ?? 5;
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () => products.flatMap((product) => product.variants.map((variant) => ({ product, variant }))),
    [products],
  );

  const stats = useMemo(() => {
    const soldVariants = rows.filter((r) => r.variant.stock <= 0).length;
    const lowVariants = rows.filter((r) => r.variant.stock > 0 && r.variant.stock <= threshold).length;
    const units = rows.reduce((sum, r) => sum + r.variant.stock, 0);
    const soldProducts = products.filter((p) => p.variants.every((v) => v.stock <= 0)).length;
    return { soldVariants, lowVariants, units, soldProducts };
  }, [rows, products, threshold]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter(({ product, variant }) => {
      if (filter === "low" && !(variant.stock > 0 && variant.stock <= threshold)) return false;
      if (filter === "sold" && variant.stock > 0) return false;
      if (!term) return true;
      return `${product.name} ${variant.size} ${variant.sku}`.toLowerCase().includes(term);
    });
  }, [rows, filter, query, threshold]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: `All (${rows.length})` },
    { id: "low", label: `Low stock (${stats.lowVariants})` },
    { id: "sold", label: `Sold out (${stats.soldVariants})` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink sm:text-3xl">Inventory</h1>
        <p className="text-sm text-muted">
          Products with no stock left are hidden from the shop and shown in the Sold section. Low stock means {threshold} or fewer (change it in Settings).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Units in stock", value: stats.units },
          { label: "Low stock sizes", value: stats.lowVariants },
          { label: "Sold out sizes", value: stats.soldVariants },
          { label: "Products sold out", value: stats.soldProducts },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wide text-muted">{s.label}</span>
              <span className="text-2xl text-ink">{s.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No inventory yet" description="Add products to start tracking stock." />
      ) : (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                    filter === f.id ? "border-ink bg-ink text-ivory" : "border-border text-ink hover:border-ink",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex h-11 items-center gap-2 rounded-(--radius-sm) border border-border bg-surface px-3 lg:w-72">
              <Search size={16} className="text-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search product, size, SKU"
                aria-label="Search inventory"
                className="h-full w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState title="Nothing matches" description="Try a different filter or search term." />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Product</TableHeaderCell>
                  <TableHeaderCell>Category</TableHeaderCell>
                  <TableHeaderCell>Variant</TableHeaderCell>
                  <TableHeaderCell>SKU</TableHeaderCell>
                  <TableHeaderCell>Stock</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map(({ product, variant }) => (
                  <TableRow key={variant.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="text-muted"><CategoryName categoryId={product.categoryId} /></TableCell>
                    <TableCell>{variant.size}</TableCell>
                    <TableCell className="text-muted">{variant.sku}</TableCell>
                    <TableCell>
                      {/* key forces a fresh input when stock changes elsewhere, e.g. from an order */}
                      <StockControl key={`${variant.id}-${variant.stock}`} productId={product.id} variantId={variant.id} stock={variant.stock} />
                    </TableCell>
                    <TableCell>
                      {variant.stock <= 0 ? <Badge variant="error">Sold Out</Badge> : variant.stock <= threshold ? <Badge variant="gold">Low Stock</Badge> : <Badge variant="success">In Stock</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}
