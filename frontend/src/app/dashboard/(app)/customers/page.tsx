"use client";

import { useMemo } from "react";
import { useOrders } from "@/lib/services/orders-service";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils/currency";

interface CustomerSummary {
  email: string;
  name: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

export default function CustomersPage() {
  const orders = useOrders();

  const customers = useMemo(() => {
    const byEmail = new Map<string, CustomerSummary>();
    for (const order of orders) {
      const existing = byEmail.get(order.email);
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += order.total;
        if (order.createdAt > existing.lastOrderAt) existing.lastOrderAt = order.createdAt;
      } else {
        byEmail.set(order.email, {
          email: order.email,
          name: order.customerName,
          phone: order.phone,
          orderCount: 1,
          totalSpent: order.total,
          lastOrderAt: order.createdAt,
        });
      }
    }
    return Array.from(byEmail.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink sm:text-3xl">Customers</h1>
        <p className="text-sm text-muted">
          Built from order history. A full account system arrives with Supabase in Phase 2.
        </p>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Customers appear here automatically once orders are placed."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Customer</TableHeaderCell>
              <TableHeaderCell>Contact</TableHeaderCell>
              <TableHeaderCell>Orders</TableHeaderCell>
              <TableHeaderCell>Total Spent</TableHeaderCell>
              <TableHeaderCell>Last Order</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.email}>
                <TableCell>{customer.name}</TableCell>
                <TableCell className="text-muted">
                  <div className="flex flex-col">
                    <span>{customer.email}</span>
                    <span className="text-xs">{customer.phone}</span>
                  </div>
                </TableCell>
                <TableCell>{customer.orderCount}</TableCell>
                <TableCell>{formatPrice(customer.totalSpent)}</TableCell>
                <TableCell className="text-muted">
                  {new Date(customer.lastOrderAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
