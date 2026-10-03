"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useCampaignsRealtime } from "@/lib/vidcica/use-campaigns-realtime";
import {
  budgetText,
  formatAdMoney,
  objectiveLabel,
  CAMPAIGN_OBJECTIVE_KEY,
  CAMPAIGN_STATUS_KEY,
  STATUS_META,
  type Campaign,
  type CampaignStatus,
  type SupportedObjective,
} from "@/lib/vidcica/campaign";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey, TFunction } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function objectiveText(t: TFunction, objective: Campaign["objective"]): string {
  const key = CAMPAIGN_OBJECTIVE_KEY[objective as SupportedObjective];
  return key ? t(key) : objectiveLabel(objective);
}

/** Which tab a campaign falls under. Live/paused/in-review are "active" work; drafts
 *  are resumable; ended/refused are archived. */
type Tab = "active" | "draft" | "ended";
const TAB_STATUSES: Record<Tab, readonly CampaignStatus[]> = {
  active: ["active", "in_review", "en_pause"],
  draft: ["brouillon"],
  ended: ["terminee", "rejected"],
};
const TABS: { id: Tab; label: MessageKey }[] = [
  { id: "active", label: "ads.tab.active" },
  { id: "draft", label: "ads.tab.draft" },
  { id: "ended", label: "ads.tab.ended" },
];

function tabOf(status: CampaignStatus): Tab {
  if (TAB_STATUSES.draft.includes(status)) return "draft";
  if (TAB_STATUSES.ended.includes(status)) return "ended";
  return "active";
}

/** One column template for the header and every row, so figures line up. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 sm:grid-cols-[minmax(0,1fr)_6.5rem_4.5rem_6.5rem_7.5rem]";
const FOCUS_RING =
  "focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

function CampaignCard({ c, currency }: { c: Campaign; currency: string }) {
  const t = useT();
  const meta = STATUS_META[c.status];
  const isDraft = c.status === "brouillon";
  return (
    <li className="flex flex-col">
      <Link
        href={`/ads/${c.id}`}
        data-testid={`campaign-${c.id}`}
        className={cn(
          ROW_GRID,
          "hover:bg-accent focus-visible:bg-accent min-h-16 px-5 py-3 transition-colors outline-none",
        )}
      >
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[15px] font-semibold">{c.name}</span>
          <span className="text-muted-foreground truncate text-[13px]">
            {objectiveText(t, c.objective)} · {budgetText(t, c, currency)}
          </span>
        </span>
        <Metric value={c.metrics.impressions.toLocaleString("fr-FR")} />
        <Metric value={c.metrics.clicks.toLocaleString("fr-FR")} />
        <Metric value={formatAdMoney(c.metrics.budgetSpent, currency)} />
        <Badge
          variant={meta.variant}
          className="justify-self-end"
          data-testid={`campaign-status-${c.id}`}
        >
          {t(CAMPAIGN_STATUS_KEY[c.status])}
        </Badge>
      </Link>
      {isDraft ? (
        <Link
          href="/ads/new"
          className={cn(
            FOCUS_RING,
            "text-foreground mb-4 ml-5 self-start rounded-full text-[13px] font-semibold underline underline-offset-4",
          )}
          data-testid={`campaign-resume-${c.id}`}
        >
          {t("ads.resumeDraft")} →
        </Link>
      ) : null}
    </li>
  );
}

/** A figure cell — shown from `sm` up, where the column header names it. */
function Metric({ value }: { value: string }) {
  return (
    <span className="text-foreground hidden truncate text-right text-[15px] tabular-nums sm:block">
      {value}
    </span>
  );
}

/**
 * The campaigns list — server-seeded, kept live over the `campaigns:{userId}`
 * channel (the sync-ad-insights cron updates status/metrics). Status tabs filter the
 * realtime list; draft cards surface a "resume in the wizard" affordance. Honest empty
 * states per tab and for a fully empty account.
 */
export function CampaignList({
  userId,
  initial,
  currency = "EUR",
}: {
  userId: string;
  initial: Campaign[];
  /** The ad account's currency (see getMyAdAccountCurrency). Every money figure
   *  below is in Meta's account currency, never assumed to be euros. */
  currency?: string;
}) {
  const t = useT();
  const campaigns = useCampaignsRealtime(userId, initial);
  const [tab, setTab] = useState<Tab>("active");

  if (campaigns.length === 0) {
    return (
      <div data-testid="ads-empty">
        <EmptyState
          className="py-16"
          title={t("ads.empty.title")}
          description={t("ads.empty.description")}
          action={
            <Link href="/ads/new" className={buttonVariants()}>
              {t("ads.boostVideo")}
            </Link>
          }
        />
      </div>
    );
  }

  const counts: Record<Tab, number> = { active: 0, draft: 0, ended: 0 };
  for (const c of campaigns) counts[tabOf(c.status)] += 1;
  const visible = campaigns.filter((c) => tabOf(c.status) === tab);

  return (
    <div className="flex flex-col gap-6" data-testid="campaign-list">
      <div
        className="bg-secondary inline-flex max-w-full gap-1 self-start overflow-x-auto rounded-full p-1"
        role="tablist"
        aria-label={t("ads.tabsAria")}
      >
        {TABS.map((tb) => {
          const selected = tab === tb.id;
          return (
            <button
              key={tb.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(tb.id)}
              data-testid={`ads-tab-${tb.id}`}
              className={cn(
                "focus-visible:ring-ring inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-2",
                selected
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(tb.label)} <span className="font-medium tabular-nums">({counts[tb.id]})</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p
          className="text-muted-foreground py-12 text-center text-[13px]"
          data-testid="ads-tab-empty"
        >
          {t("ads.tab.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <div
            className={cn(ROW_GRID, "text-muted-foreground hidden px-5 text-[13px] sm:grid")}
            aria-hidden
          >
            <span />
            <span className="text-right">{t("ads.metric.impressions")}</span>
            <span className="text-right">{t("ads.metric.clicks")}</span>
            <span className="text-right">{t("ads.metric.spent")}</span>
            <span />
          </div>
          <ul className="bg-card divide-border flex flex-col divide-y overflow-hidden rounded-lg">
            {visible.map((c) => (
              <CampaignCard key={c.id} c={c} currency={currency} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
