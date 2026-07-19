"use client";

import { useId, useState } from "react";
import { AnimatePresence, m } from "@/components/motion";
import { cn } from "@/lib/utils";

export type FaqItem = { q: string; a: string };

/**
 * Animated FAQ accordion — smooth height + fade on open/close (motion, honors
 * prefers-reduced-motion via the global MotionConfig). One item open at a time,
 * proper disclosure semantics (aria-expanded / aria-controls).
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div className="border-border divide-border bg-card divide-y rounded-lg border px-5">
      {items.map((f, i) => {
        const open = openIndex === i;
        const panelId = `${baseId}-faq-${i}`;
        return (
          <div key={f.q}>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenIndex(open ? null : i)}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left text-sm font-medium transition-colors",
                open ? "text-foreground" : "text-foreground/90 hover:text-foreground",
              )}
            >
              {f.q}
              <m.svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-muted-foreground size-4 shrink-0"
                aria-hidden
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <path d="m6 9 6 6 6-6" />
              </m.svg>
            </button>
            <AnimatePresence initial={false}>
              {open ? (
                <m.div
                  id={panelId}
                  key="panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.3, 0.7, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="text-muted-foreground pb-4 text-sm leading-relaxed">{f.a}</p>
                </m.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
