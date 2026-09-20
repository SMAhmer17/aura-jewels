"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Search box used at the top of every dashboard list. */
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex h-11 items-center gap-2 rounded-(--radius-sm) border border-border bg-surface px-3", className)}>
      <Search size={16} className="shrink-0 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-full w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
      />
    </div>
  );
}

/** Row of pill toggles for a single-choice filter. */
export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
            value === o.id ? "border-ink bg-ink text-ivory" : "border-border text-ink hover:border-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Compact labelled select for secondary filters and sorting. */
export function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-11 rounded-(--radius-sm) border border-border bg-surface px-3 text-sm text-ink focus:border-gold focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Shows how many rows match and a one-click way to clear filters. */
export function ResultsBar({ shown, total, onClear, active }: { shown: number; total: number; onClear: () => void; active: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs text-muted">
      <span>
        Showing {shown} of {total}
      </span>
      {active && (
        <button type="button" onClick={onClear} className="underline underline-offset-4 hover:text-ink">
          Clear filters
        </button>
      )}
    </div>
  );
}
