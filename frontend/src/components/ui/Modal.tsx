"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
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
      className={cn(
        "m-auto w-full max-w-md rounded-(--radius-lg) border border-border bg-surface p-6 shadow-(--shadow-elevated) backdrop:bg-ink/60 open:animate-none",
        className,
      )}
    >
      {title && (
        <h2 className="mb-4 text-xl text-ink" id="modal-title">
          {title}
        </h2>
      )}
      {children}
    </dialog>
  );
}
