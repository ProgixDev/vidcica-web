"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useCampaignsRealtime } from "@/lib/vidcica/use-campaigns-realtime";
import {
  budgetText,
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

function CampaignCard({ c }: { c: Campaign }) {
  const t = useT();
  const meta = STATUS_META[c.status];
  const isDraft = c.status === "brouillon";
  return (
    <div className="flex flex-col gap-1">
      <Link href={`/ads/${c.id}`} data-testid={`campaign-${c.id}`} className="block">
        <Card className="hover:border-primary/40 flex flex-col gap-3 p-4 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-medium">{c.name}</span>
              <span className="text-muted-foreground text-xs">
                {objectiveText(t, c.objective)} · {budgetText(t, c)}
              </span>
            </div>
            <Badge variant={meta.variant} data-testid={`campaign-status-${c.id}`}>
              {t(CAMPAIGN_STATUS_KEY[c.status])}
            </Badge>
          </div>
          <div className="text-muted-foreground grid grid-cols-3 gap-2 text-xs">
            <Metric
              label={t("ads.metric.impressions")}
              value={c.metrics.impressions.toLocaleString("fr-FR")}
            />
            <Metric
              label={t("ads.metric.clicks")}
              value={c.metrics.clicks.toLocaleString("fr-FR")}
            />
            <Metric label={t("ads.metric.spent")} value={`${c.metrics.budgetSpent.toFixed(2)} €`} />
          </div>
        </Card>
      </Link>
      {isDraft ? (
        <Link
          href="/ads/new"
          className="text-primary self-start px-1 text-xs font-medium hover:underline"
          data-testid={`campaign-resume-${c.id}`}
        >
          {t("ads.resumeDraft")} →
        </Link>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-foreground text-sm font-medium">{value}</span>
      <span>{label}</span>
    </div>
  );
}

/**
 * The campaigns list — server-seeded, kept live over the `campaigns:{userId}`
 * channel (the sync-ad-insights cron updates status/metrics). Status tabs filter the
 * realtime list; draft cards surface a "resume in the wizard" affordance. Honest empty
 * states per tab and for a fully empty account.
 */
export function CampaignList({ userId, initial }: { userId: string; initial: Campaign[] }) {
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
    <div className="flex flex-col gap-4" data-testid="campaign-list">
      <div
        className="border-border inline-flex gap-1 self-start rounded-full border p-1"
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
              className={
                selected
                  ? "bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-medium"
                  : "text-muted-foreground hover:text-foreground rounded-full px-3 py-1 text-xs font-medium"
              }
            >
              {t(tb.label)} ({counts[tb.id]})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm" data-testid="ads-tab-empty">
          {t("ads.tab.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((c) => (
            <CampaignCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
