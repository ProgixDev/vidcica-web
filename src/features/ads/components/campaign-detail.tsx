import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  OBJECTIVE_LABEL,
  STATUS_META,
  type Campaign,
  type SupportedObjective,
} from "@/lib/vidcica/campaign";
import { ActivatePauseControls } from "./activate-pause-controls";

function objectiveLabel(objective: Campaign["objective"]): string {
  return OBJECTIVE_LABEL[objective as SupportedObjective] ?? objective;
}

function budgetLabel(c: Campaign): string {
  return c.budgetMode === "total" ? `${c.budgetTotal} € au total` : `${c.budgetDaily ?? 0} €/jour`;
}

type NumericMetric = Exclude<keyof Campaign["metrics"], "updatedAt">;
const METRICS: { key: NumericMetric; label: string; fmt: (n: number) => string }[] = [
  { key: "budgetSpent", label: "Dépensé", fmt: (n) => `${n.toFixed(2)} €` },
  { key: "reach", label: "Portée", fmt: (n) => n.toLocaleString("fr-FR") },
  { key: "impressions", label: "Impressions", fmt: (n) => n.toLocaleString("fr-FR") },
  { key: "clicks", label: "Clics", fmt: (n) => n.toLocaleString("fr-FR") },
  { key: "ctr", label: "CTR", fmt: (n) => `${n.toFixed(2)} %` },
  { key: "cpc", label: "CPC", fmt: (n) => `${n.toFixed(2)} €` },
  { key: "cpm", label: "CPM", fmt: (n) => `${n.toFixed(2)} €` },
  { key: "conversions", label: "Conversions", fmt: (n) => n.toLocaleString("fr-FR") },
  { key: "leads", label: "Leads", fmt: (n) => n.toLocaleString("fr-FR") },
];

/** Campaign detail: summary + live metric grid (honest zeros until the cron fills
 *  them) + activate/pause. Server-rendered; the controls are a client leaf. */
export function CampaignDetail({ campaign }: { campaign: Campaign }) {
  const meta = STATUS_META[campaign.status];
  const noData = !campaign.metrics.updatedAt;

  return (
    <div className="flex flex-col gap-6" data-testid="campaign-detail">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold tracking-tight">{campaign.name}</h1>
          <p className="text-muted-foreground text-sm">
            {objectiveLabel(campaign.objective)} · {budgetLabel(campaign)}
          </p>
        </div>
        <Badge variant={meta.variant} data-testid="detail-status">
          {meta.label}
        </Badge>
      </div>

      <ActivatePauseControls campaign={campaign} />

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Performance</h2>
          {noData ? (
            <span className="text-muted-foreground text-xs" data-testid="metrics-pending">
              En attente des premières données
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">
              Mis à jour {new Date(campaign.metrics.updatedAt!).toLocaleString("fr-FR")}
            </span>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {METRICS.map((m) => (
            <div key={m.key} className="flex flex-col">
              <dd className="text-lg font-semibold">{m.fmt(campaign.metrics[m.key])}</dd>
              <dt className="text-muted-foreground text-xs">{m.label}</dt>
            </div>
          ))}
        </dl>
      </Card>

      {campaign.lastError ? (
        <p className="text-muted-foreground text-xs">
          Dernière erreur technique : {campaign.lastError}
        </p>
      ) : null}
    </div>
  );
}
