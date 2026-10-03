"use client";

import { Badge } from "@/components/ui/badge";
import {
  budgetText,
  formatAdMoney,
  objectiveLabel,
  CAMPAIGN_OBJECTIVE_KEY,
  CAMPAIGN_STATUS_KEY,
  STATUS_META,
  type Campaign,
  type SupportedObjective,
} from "@/lib/vidcica/campaign";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { ActivatePauseControls } from "./activate-pause-controls";
import { CampaignManageControls } from "./campaign-manage";

type NumericMetric = Exclude<keyof Campaign["metrics"], "updatedAt">;
/** Money is in the AD ACCOUNT's currency (Meta denominates spend, CPC and CPM
 *  there), so the money formatters take it; counts and rates ignore it. */
const METRICS: {
  key: NumericMetric;
  label: MessageKey;
  fmt: (n: number, currency: string) => string;
}[] = [
  {
    key: "budgetSpent",
    label: "ads.metric.spent",
    fmt: (n, currency) => formatAdMoney(n, currency),
  },
  { key: "reach", label: "ads.metric.reach", fmt: (n) => n.toLocaleString("fr-FR") },
  { key: "impressions", label: "ads.metric.impressions", fmt: (n) => n.toLocaleString("fr-FR") },
  { key: "clicks", label: "ads.metric.clicks", fmt: (n) => n.toLocaleString("fr-FR") },
  { key: "ctr", label: "ads.metric.ctr", fmt: (n) => `${n.toFixed(2)} %` },
  { key: "cpc", label: "ads.metric.cpc", fmt: (n, currency) => formatAdMoney(n, currency) },
  { key: "cpm", label: "ads.metric.cpm", fmt: (n, currency) => formatAdMoney(n, currency) },
  { key: "conversions", label: "ads.metric.conversions", fmt: (n) => n.toLocaleString("fr-FR") },
  { key: "leads", label: "ads.metric.leads", fmt: (n) => n.toLocaleString("fr-FR") },
];

/** Campaign detail: summary + live metric grid (honest zeros until the cron fills
 *  them) + activate/pause. Server-rendered; the controls are a client leaf. */
export function CampaignDetail({
  campaign,
  currency = "EUR",
}: {
  campaign: Campaign;
  /** The ad account's currency (see getMyAdAccountCurrency). A CAD account spends
   *  CAD; showing "€" would misstate what the campaign cost. */
  currency?: string;
}) {
  const t = useT();
  const meta = STATUS_META[campaign.status];
  const noData = !campaign.metrics.updatedAt;
  const objectiveKey = CAMPAIGN_OBJECTIVE_KEY[campaign.objective as SupportedObjective];

  return (
    <div className="flex flex-col gap-10" data-testid="campaign-detail">
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-[28px] leading-9 font-semibold tracking-[-0.03em] sm:text-[32px] sm:leading-10">
              {campaign.name}
            </h1>
            <p className="text-muted-foreground text-[15px] leading-relaxed">
              {objectiveKey ? t(objectiveKey) : objectiveLabel(campaign.objective)} ·{" "}
              {budgetText(t, campaign, currency)}
            </p>
          </div>
          <Badge variant={meta.variant} className="mt-2 shrink-0" data-testid="detail-status">
            {t(CAMPAIGN_STATUS_KEY[campaign.status])}
          </Badge>
        </div>

        <ActivatePauseControls campaign={campaign} />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-xl font-semibold tracking-tight">{t("ads.performance")}</h2>
          {noData ? (
            <span className="text-muted-foreground text-[13px]" data-testid="metrics-pending">
              {t("ads.metricsPending")}
            </span>
          ) : (
            <span className="text-muted-foreground text-[13px]">
              {t("ads.updatedAt", {
                date: new Date(campaign.metrics.updatedAt!).toLocaleString("fr-FR"),
              })}
            </span>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {METRICS.map((m) => (
            <div key={m.key} className="bg-card flex min-w-0 flex-col gap-3 rounded-lg p-5">
              <dt className="text-muted-foreground truncate text-[13px]">{t(m.label)}</dt>
              <dd className="truncate text-[28px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                {m.fmt(campaign.metrics[m.key], currency)}
              </dd>
            </div>
          ))}
        </dl>
        {campaign.lastError ? (
          <p className="text-muted-foreground text-[13px] leading-relaxed">
            {t("ads.lastError", { error: campaign.lastError })}
          </p>
        ) : null}
      </section>

      <CampaignManageControls campaign={campaign} />
    </div>
  );
}
