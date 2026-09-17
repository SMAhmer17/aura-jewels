"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/Dropdown";
import { toast } from "@/store/toast-store";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-b border-border pb-12">
      <h2 className="text-2xl text-ink">{title}</h2>
      {children}
    </section>
  );
}

export default function StyleGuidePage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16">
      <header>
        <p className="text-xs uppercase tracking-widest text-gold">Aura Jewels</p>
        <h1 className="text-4xl text-ink">Design System Style Guide</h1>
        <p className="mt-2 text-sm text-muted">
          Internal reference for foundational UI components and design tokens. Not a public
          route.
        </p>
      </header>

      <Section title="Color palette">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { name: "Ink", cls: "bg-ink" },
            { name: "Ink Soft", cls: "bg-ink-soft" },
            { name: "Gold", cls: "bg-gold" },
            { name: "Gold Light", cls: "bg-gold-light" },
            { name: "Ivory", cls: "bg-ivory border border-border" },
            { name: "Cream", cls: "bg-cream" },
            { name: "Success", cls: "bg-success" },
            { name: "Error", cls: "bg-error" },
          ].map((c) => (
            <div key={c.name} className="flex flex-col gap-2">
              <div className={`h-16 rounded-(--radius-md) ${c.cls}`} />
              <span className="text-xs text-muted">{c.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl">Heading 1 (Cormorant Garamond)</h1>
          <h2 className="text-3xl">Heading 2 (Cormorant Garamond)</h2>
          <h3 className="text-2xl">Heading 3 (Cormorant Garamond)</h3>
          <p className="font-body text-base">
            Body text (Inter). The quick brown fox jumps over the lazy dog. Rs. 45,000
          </p>
          <p className="font-body text-sm text-muted">
            Muted / supporting text (Inter), for secondary information.
          </p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary">Add to Cart</Button>
          <Button variant="gold">Shop Now</Button>
          <Button variant="outline">View Details</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="link">View all policies</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="gold">New</Badge>
          <Badge variant="success">In Stock</Badge>
          <Badge variant="error">Sold Out</Badge>
          <Badge variant="dark">Limited Edition</Badge>
        </div>
      </Section>

      <Section title="Card">
        <Card className="max-w-sm">
          <CardHeader>
            <h3 className="text-lg text-ink">Aurora Solitaire Ring</h3>
            <p className="text-sm text-muted">18k gold-plated · Size 7</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink">Rs. 42,500</p>
          </CardContent>
          <CardFooter>
            <Button size="sm">Add to Cart</Button>
            <Button size="sm" variant="ghost">
              Wishlist
            </Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Form / Input">
        <div className="flex max-w-sm flex-col gap-4">
          <Input label="Email address" placeholder="you@example.com" />
          <Input label="Promo code" error="This code has expired" />
          <Input label="Full name" hint="As it should appear on the invoice" />
        </div>
      </Section>

      <Section title="Table">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Product</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Stock</TableHeaderCell>
              <TableHeaderCell>Price</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Aurora Solitaire Ring</TableCell>
              <TableCell>Rings</TableCell>
              <TableCell>12</TableCell>
              <TableCell>Rs. 42,500</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Ivory Pearl Necklace</TableCell>
              <TableCell>Necklaces</TableCell>
              <TableCell>0</TableCell>
              <TableCell>Rs. 58,000</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>

      <Section title="Empty state">
        <EmptyState
          title="Your wishlist is empty"
          description="Save pieces you love and come back to them anytime."
          action={<Button variant="outline">Continue Shopping</Button>}
        />
      </Section>

      <Section title="Skeleton / loading">
        <div className="flex max-w-sm flex-col gap-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </Section>

      <Section title="Modal">
        <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Remove item?">
          <p className="text-sm text-muted">
            This will remove the Aurora Solitaire Ring from your cart.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Remove
            </Button>
          </div>
        </Modal>
      </Section>

      <Section title="Dropdown">
        <Dropdown>
          <DropdownTrigger className="rounded-(--radius-sm) border border-border px-4 py-2 text-sm">
            Sort by ▾
          </DropdownTrigger>
          <DropdownContent>
            <DropdownItem>Newest</DropdownItem>
            <DropdownItem>Price: Low to High</DropdownItem>
            <DropdownItem>Price: High to Low</DropdownItem>
          </DropdownContent>
        </Dropdown>
      </Section>

      <Section title="Toast">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => toast({ title: "Added to cart", description: "Aurora Solitaire Ring", variant: "success" })}
          >
            Trigger success toast
          </Button>
          <Button
            variant="outline"
            onClick={() => toast({ title: "Something went wrong", description: "Please try again.", variant: "error" })}
          >
            Trigger error toast
          </Button>
        </div>
      </Section>
    </main>
  );
}
