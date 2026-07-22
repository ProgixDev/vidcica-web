"use client";

import { useT } from "@/lib/i18n/provider";
import { GUIDES } from "../faq-data";

/** Static list of written guides (titles + short descriptions). No article body
 *  yet — the copy points the user to the in-app flow the guide covers. */
export function GuidesList() {
  const t = useT();
  return (
    <div className="flex flex-col gap-4" data-testid="guides-list">
      <div className="bg-card divide-border/60 flex flex-col divide-y rounded-2xl border">
        {GUIDES.map((g) => (
          <div
            key={g.id}
            className="flex items-start gap-3 px-4 py-3.5"
            data-testid={`guide-${g.id}`}
          >
            <span
              aria-hidden
              className="bg-accent text-accent-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium">{t(g.titleKey)}</span>
              <span className="text-muted-foreground text-xs leading-relaxed">{t(g.descKey)}</span>
            </span>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground px-1 text-xs">{t("help.guide.comingSoon")}</p>
    </div>
  );
}
