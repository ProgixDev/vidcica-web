"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import { FAQ_CATEGORIES, FAQ_ENTRIES, type FaqCategory } from "../faq-data";

type Filter = FaqCategory | "all";

/** Searchable, categorised FAQ. Filters by question/answer text (active locale)
 *  and by category chip. Each row is an accordion. */
export function FaqSection({ onContact }: { onContact: () => void }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_ENTRIES.filter((item) => {
      if (active !== "all" && item.category !== active) return false;
      if (!q) return true;
      const question = t(item.questionKey).toLowerCase();
      const answer = t(item.answerKey).toLowerCase();
      return question.includes(q) || answer.includes(q);
    });
  }, [query, active, t]);

  return (
    <div className="flex flex-col gap-4" data-testid="faq-section">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("help.search.placeholder")}
        aria-label={t("help.search.placeholder")}
        data-testid="faq-search"
      />

      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("help.faq.filterLabel")}>
        {(["all", ...FAQ_CATEGORIES.map((c) => c.id)] as Filter[]).map((id) => {
          const label =
            id === "all"
              ? t("help.faq.cat.all")
              : t(FAQ_CATEGORIES.find((c) => c.id === id)!.labelKey);
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              aria-pressed={active === id}
              data-testid={`faq-chip-${id}`}
              className={cn(
                "focus-visible:ring-ring rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                active === id
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "border-input text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          className="py-12"
          title={t("help.faq.empty.title")}
          description={t("help.faq.empty.body")}
          action={
            <button
              type="button"
              onClick={onContact}
              data-testid="faq-empty-contact"
              className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium"
            >
              {t("help.faq.empty.cta")}
            </button>
          }
        />
      ) : (
        <div className="bg-card divide-border/60 flex flex-col divide-y rounded-2xl border">
          {filtered.map((item) => {
            const isOpen = open === item.id;
            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : item.id)}
                  aria-expanded={isOpen}
                  data-testid={`faq-row-${item.id}`}
                  className="hover:bg-muted/60 flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <span className="flex-1 text-sm font-medium">{t(item.questionKey)}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cn(
                      "text-muted-foreground/70 shrink-0 transition-transform",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {isOpen ? (
                  <p className="text-muted-foreground px-4 pb-4 text-sm leading-relaxed">
                    {t(item.answerKey)}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
