"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  budgetText,
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

type NumericMetric = Exclude<keyof Campaign["metrics"], "updatedAt">;
const METRICS: { key: NumericMetric; label: MessageKey; fmt: (n: number) => string }[] = [
  { key: "budgetSpent", label: "ads.metric.spent", fmt: (n) => `${n.toFixed(2)} €` },
  { key: "reach", label: "ads.metric.reach", fmt: (n) => n.toLocaleString("fr-FR") },
  { key: "impressions", label: "ads.metric.impressions", fmt: (n) => n.toLocaleString("fr-FR") },
  { key: "clicks", label: "ads.metric.clicks", fmt: (n) => n.toLocaleString("fr-FR") },
  { key: "ctr", label: "ads.metric.ctr", fmt: (n) => `${n.toFixed(2)} %` },
  { key: "cpc", label: "ads.metric.cpc", fmt: (n) => `${n.toFixed(2)} €` },
  { key: "cpm", label: "ads.metric.cpm", fmt: (n) => `${n.toFixed(2)} €` },
  { key: "conversions", label: "ads.metric.conversions", fmt: (n) => n.toLocaleString("fr-FR") },
  { key: "leads", label: "ads.metric.leads", fmt: (n) => n.toLocaleString("fr-FR") },
];

/** Campaign detail: summary + live metric grid (honest zeros until the cron fills
 *  them) + activate/pause. Server-rendered; the controls are a client leaf. */
export function CampaignDetail({ campaign }: { campaign: Campaign }) {
  const t = useT();
  const meta = STATUS_META[campaign.status];
  const noData = !campaign.metrics.updatedAt;
  const objectiveKey = CAMPAIGN_OBJECTIVE_KEY[campaign.objective as SupportedObjective];

  return (
    <div className="flex flex-col gap-6" data-testid="campaign-detail">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold tracking-tight">{campaign.name}</h1>
          <p className="text-muted-foreground text-sm">
            {objectiveKey ? t(objectiveKey) : objectiveLabel(campaign.objective)} ·{" "}
            {budgetText(t, campaign)}
          </p>
        </div>
        <Badge variant={meta.variant} data-testid="detail-status">
          {t(CAMPAIGN_STATUS_KEY[campaign.status])}
        </Badge>
      </div>

      <ActivatePauseControls campaign={campaign} />

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">{t("ads.performance")}</h2>
          {noData ? (
            <span className="text-muted-foreground text-xs" data-testid="metrics-pending">
              {t("ads.metricsPending")}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">
              {t("ads.updatedAt", {
                date: new Date(campaign.metrics.updatedAt!).toLocaleString("fr-FR"),
              })}
            </span>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {METRICS.map((m) => (
            <div key={m.key} className="flex flex-col">
              <dd className="text-lg font-semibold">{m.fmt(campaign.metrics[m.key])}</dd>
              <dt className="text-muted-foreground text-xs">{t(m.label)}</dt>
            </div>
          ))}
        </dl>
      </Card>

      {campaign.lastError ? (
        <p className="text-muted-foreground text-xs">
          {t("ads.lastError", { error: campaign.lastError })}
        </p>
      ) : null}
    </div>
  );
}
