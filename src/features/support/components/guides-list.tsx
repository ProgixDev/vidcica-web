"use client";

import { useT } from "@/lib/i18n/provider";
import { GUIDES } from "../faq-data";

/** Static list of written guides (titles + short descriptions). No article body
 *  yet — the copy points the user to the in-app flow the guide covers. */
export function GuidesList() {
  const t = useT();
  return (
    <div className="flex flex-col gap-4" data-testid="guides-list">
      <div className="bg-card flex flex-col rounded-lg py-2">
        {GUIDES.map((g) => (
          <div
            key={g.id}
            className="flex min-h-14 items-start gap-4 px-5 py-3"
            data-testid={`guide-${g.id}`}
          >
            <span aria-hidden className="text-foreground mt-0.5 shrink-0">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] leading-snug font-semibold">{t(g.titleKey)}</span>
              <span className="text-muted-foreground text-[13px] leading-relaxed">
                {t(g.descKey)}
              </span>
            </span>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-[13px]">{t("help.guide.comingSoon")}</p>
    </div>
  );
}
