"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface AccordionItem {
  question: string;
  answer: string;
}

/** One-open-at-a-time accordion. Panels animate height via the grid-rows 0fr/1fr technique. */
export function Accordion({ items, className }: { items: AccordionItem[]; className?: string }) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={cn("divide-y divide-border border-y border-border", className)}>
      {items.map((item, i) => {
        const open = openIndex === i;
        const buttonId = `${baseId}-btn-${i}`;
        const panelId = `${baseId}-panel-${i}`;

        return (
          <div key={item.question}>
            <h3 className="text-base">
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : i)}
                className={cn(
                  "flex w-full items-center justify-between gap-4 py-5 text-left font-body font-normal transition-colors hover:text-gold focus-visible:outline-none focus-visible:text-gold",
                  open ? "text-gold" : "text-ink",
                )}
              >
                <span>{item.question}</span>
                <span aria-hidden className="relative h-3.5 w-3.5 shrink-0 text-gold">
                  <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
                  <span
                    className={cn(
                      "absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current transition-transform duration-300 ease-out motion-reduce:transition-none",
                      open && "rotate-90",
                    )}
                  />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!open}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="pb-5 pr-8 text-sm leading-relaxed text-muted">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
