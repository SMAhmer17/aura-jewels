"use client";

import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils/cn";

interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdownContext() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error("Dropdown compound components must be used within <Dropdown>");
  return ctx;
}

export function Dropdown({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={rootRef} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownTrigger({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useDropdownContext();
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup="menu"
      onClick={() => setOpen(!open)}
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { open } = useDropdownContext();
  if (!open) return null;
  return (
    <div
      role="menu"
      className={cn(
        "absolute right-0 z-40 mt-2 min-w-[10rem] rounded-(--radius-md) border border-border bg-surface py-1.5 shadow-(--shadow-elevated)",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownItem({
  className,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDropdownContext();
  return (
    <button
      type="button"
      role="menuitem"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-ink hover:bg-cream/60",
        className,
      )}
      {...props}
    />
  );
}
