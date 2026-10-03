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
    <div className="divide-border flex flex-col divide-y">
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
                "focus-visible:ring-ring flex w-full cursor-pointer items-center justify-between gap-6 rounded-sm py-5 text-left text-[17px] font-semibold tracking-tight outline-none focus-visible:ring-2",
                "text-foreground",
              )}
            >
              {f.q}
              <m.svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                className="text-muted-foreground size-5 shrink-0"
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
                  <p className="text-muted-foreground max-w-2xl pb-6 text-[15px] leading-relaxed">
                    {f.a}
                  </p>
                </m.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
