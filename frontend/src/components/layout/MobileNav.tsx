"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Category } from "@/types/category";

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}

export function MobileNav({ open, onClose, categories }: MobileNavProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-xs border-0 border-l border-ink/10 bg-ivory/95 p-0 shadow-(--shadow-elevated) backdrop-blur-xl backdrop-saturate-150 backdrop:bg-ink/35 open:animate-[drawer-in_250ms_ease-out] motion-reduce:open:animate-none"
    >
      <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
        <span className="text-lg text-ink">Menu</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="text-2xl leading-none text-ink"
        >
          &times;
        </button>
      </div>
      <nav className="flex flex-col px-6 py-4">
        <Link href="/" onClick={onClose} className="border-b border-ink/10 py-4 text-base text-ink">
          Home
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/shop/${category.slug}`}
            onClick={onClose}
            className="border-b border-ink/10 py-4 text-base text-ink"
          >
            {category.name}
          </Link>
        ))}
        <Link href="/shop" onClick={onClose} className="border-b border-ink/10 py-4 text-base text-ink">
          Shop All
        </Link>
        <Link href="/about" onClick={onClose} className="border-b border-ink/10 py-4 text-base text-ink">
          About
        </Link>
        <Link href="/track-order" onClick={onClose} className="border-b border-ink/10 py-4 text-base text-ink">
          Track Your Order
        </Link>
        <Link href="/contact" onClick={onClose} className="py-4 text-base text-ink">
          Contact
        </Link>
      </nav>
    </dialog>
  );
}
