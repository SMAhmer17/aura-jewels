"use client";

import { useAllProducts, useCategoryById, updateProduct } from "@/lib/services/catalog-service";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";

function CategoryName({ categoryId }: { categoryId: string }) {
  const category = useCategoryById(categoryId);
  return <span>{category?.name ?? "Uncategorized"}</span>;
}

function stockBadge(stock: number) {
  if (stock === 0) return <Badge variant="error">Sold Out</Badge>;
  if (stock <= 5) return <Badge variant="gold">Low Stock</Badge>;
  return <Badge variant="success">In Stock</Badge>;
}

export default function InventoryPage() {
  const products = useAllProducts();
  const rows = products.flatMap((product) =>
    product.variants.map((variant) => ({ product, variant })),
  );

  function handleStockChange(productId: string, variantId: string, value: string) {
    const stock = Math.max(0, Number(value) || 0);
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    updateProduct(productId, {
      variants: product.variants.map((v) => (v.id === variantId ? { ...v, stock } : v)),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink sm:text-3xl">Inventory</h1>
        <p className="text-sm text-muted">Update stock levels per size/variant.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No inventory yet" description="Add products to start tracking stock." />
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
            {rows.map(({ product, variant }) => (
              <TableRow key={variant.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell className="text-muted">
                  <CategoryName categoryId={product.categoryId} />
                </TableCell>
                <TableCell>{variant.size}</TableCell>
                <TableCell className="text-muted">{variant.sku}</TableCell>
                <TableCell>
                  <input
                    type="number"
                    min="0"
                    defaultValue={variant.stock}
                    onBlur={(e) => handleStockChange(product.id, variant.id, e.target.value)}
                    className="h-9 w-20 rounded-(--radius-sm) border border-border bg-surface px-2 text-sm text-ink focus:border-gold focus:outline-none"
                  />
                </TableCell>
                <TableCell>{stockBadge(variant.stock)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
