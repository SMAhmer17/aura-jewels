"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms — pass index * 60 for a cascading grid effect. */
  delay?: number;
}

/**
 * Fades + slides content in once it scrolls into view. Skips the animation
 * entirely for prefers-reduced-motion, and never blocks content — if
 * IntersectionObserver never fires, the element still renders (just static).
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // window.matchMedia is unavailable during SSR, so this can only be
      // checked post-mount — matches the zustand SSR-hydration pattern used
      // elsewhere in this codebase (see AuthGuard).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
