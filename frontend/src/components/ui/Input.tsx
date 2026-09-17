import { type InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            "h-12 rounded-(--radius-sm) border bg-surface px-4 text-base text-ink placeholder:text-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold/40",
            error ? "border-error" : "border-border focus:border-gold",
            className,
          )}
          {...props}
        />
        {error ? (
          <p id={errorId} className="text-xs text-error">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-xs text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
