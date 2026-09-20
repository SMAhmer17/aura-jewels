"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/** Right-side slide-in panel built on the native <dialog> (focus trap, Esc, backdrop for free). */
export function Drawer({ open, onClose, title, children, className }: DrawerProps) {
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
      aria-label={title}
      className={cn(
        "m-0 ml-auto h-dvh max-h-dvh w-full max-w-md border-0 border-l border-ink/10 bg-ivory/95 p-0 shadow-(--shadow-elevated) backdrop-blur-xl backdrop-saturate-150 backdrop:bg-ink/35 open:animate-[drawer-in_250ms_ease-out] motion-reduce:open:animate-none",
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <h2 className="font-body text-sm font-medium uppercase tracking-[0.2em] text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink hover:text-gold">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{open && children}</div>
      </div>
    </dialog>
  );
}
