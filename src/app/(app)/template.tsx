"use client";

import { m } from "@/components/motion";

/**
 * Per-navigation page transition for the authed area — templates remount on
 * every route change, so page content fades/rises in while the shell around it
 * stays put. Mirrors the layout's flex column so section gaps are preserved.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <m.div
      className="flex w-full flex-1 flex-col gap-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      {children}
    </m.div>
  );
}
