"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col gap-5" data-testid="faq-section">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("help.search.placeholder")}
        aria-label={t("help.search.placeholder")}
        data-testid="faq-search"
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label={t("help.faq.filterLabel")}>
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
                "focus-visible:ring-ring focus-visible:ring-offset-background h-9 rounded-full px-4 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                active === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-accent",
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
            <Button onClick={onContact} data-testid="faq-empty-contact">
              {t("help.faq.empty.cta")}
            </Button>
          }
        />
      ) : (
        <div className="divide-border flex flex-col divide-y">
          {filtered.map((item) => {
            const isOpen = open === item.id;
            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : item.id)}
                  aria-expanded={isOpen}
                  data-testid={`faq-row-${item.id}`}
                  className="focus-visible:ring-ring flex min-h-14 w-full items-center gap-4 rounded-sm py-4 text-left outline-none focus-visible:ring-2"
                >
                  <span className="flex-1 text-[15px] leading-snug font-semibold">
                    {t(item.questionKey)}
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cn(
                      "text-muted-foreground shrink-0 transition-transform",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {isOpen ? (
                  <p className="text-muted-foreground max-w-prose pr-8 pb-5 text-[15px] leading-relaxed">
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
