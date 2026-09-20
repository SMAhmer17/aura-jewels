"use client";

import { useMemo, useState } from "react";
import { useOrders } from "@/lib/services/orders-service";
import { countsAsSale } from "@/lib/utils/order-status";
import { FilterSelect, ResultsBar, SearchField } from "@/components/features/dashboard/DashboardFilters";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils/currency";

interface CustomerSummary {
  email: string;
  name: string;
  phone: string;
  city: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

type Sort = "spent" | "orders" | "recent" | "name";

export default function CustomersPage() {
  const orders = useOrders();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("spent");
  const [repeatOnly, setRepeatOnly] = useState(false);

  const customers = useMemo(() => {
    const byEmail = new Map<string, CustomerSummary>();
    for (const order of orders) {
      if (!countsAsSale(order)) continue;
      const key = order.email.toLowerCase();
      const existing = byEmail.get(key);
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += order.total;
        if (order.createdAt > existing.lastOrderAt) existing.lastOrderAt = order.createdAt;
      } else {
        byEmail.set(key, {
          email: order.email,
          name: order.customerName,
          phone: order.phone,
          city: order.city,
          orderCount: 1,
          totalSpent: order.total,
          lastOrderAt: order.createdAt,
        });
      }
    }
    return Array.from(byEmail.values());
  }, [orders]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = customers.filter((c) => {
      if (repeatOnly && c.orderCount < 2) return false;
      return !term || `${c.name} ${c.email} ${c.phone} ${c.city}`.toLowerCase().includes(term);
    });
    return list.sort((a, b) => {
      if (sort === "orders") return b.orderCount - a.orderCount;
      if (sort === "recent") return b.lastOrderAt.localeCompare(a.lastOrderAt);
      if (sort === "name") return a.name.localeCompare(b.name);
      return b.totalSpent - a.totalSpent;
    });
  }, [customers, query, sort, repeatOnly]);

  const filtersActive = query !== "" || repeatOnly;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink sm:text-3xl">Customers</h1>
        <p className="text-sm text-muted">
          Built from order history. Cancelled orders are not counted.        </p>
      </div>

      {customers.length === 0 ? (
        <EmptyState title="No customers yet" description="Customers appear here automatically once orders are placed." />
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchField value={query} onChange={setQuery} placeholder="Search name, email, phone, city" label="Search customers" className="lg:w-80" />
            <FilterSelect
              label="Sort"
              value={sort}
              onChange={setSort}
              options={[
                { id: "spent", label: "Highest spend" },
                { id: "orders", label: "Most orders" },
                { id: "recent", label: "Most recent" },
                { id: "name", label: "Name A to Z" },
              ]}
            />
            <label className="flex h-11 cursor-pointer items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={repeatOnly} onChange={(e) => setRepeatOnly(e.target.checked)} className="h-4 w-4 accent-gold" />
              Repeat customers only
            </label>
          </div>
          <ResultsBar shown={visible.length} total={customers.length} active={filtersActive} onClear={() => { setQuery(""); setRepeatOnly(false); }} />

          {visible.length === 0 ? (
            <EmptyState title="No matching customers" description="Try a different search." />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Customer</TableHeaderCell>
                  <TableHeaderCell>Contact</TableHeaderCell>
                  <TableHeaderCell>City</TableHeaderCell>
                  <TableHeaderCell>Orders</TableHeaderCell>
                  <TableHeaderCell>Total Spent</TableHeaderCell>
                  <TableHeaderCell>Last Order</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((customer) => (
                  <TableRow key={customer.email}>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell className="text-muted">
                      <div className="flex flex-col">
                        <span>{customer.email}</span>
                        <span className="text-xs">{customer.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted">{customer.city}</TableCell>
                    <TableCell>{customer.orderCount}</TableCell>
                    <TableCell>{formatPrice(customer.totalSpent)}</TableCell>
                    <TableCell className="text-muted">{new Date(customer.lastOrderAt).toLocaleDateString()}</TableCell>
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
