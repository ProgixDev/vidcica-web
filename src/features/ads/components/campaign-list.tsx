"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useCampaignsRealtime } from "@/lib/vidcica/use-campaigns-realtime";
import {
  OBJECTIVE_LABEL,
  STATUS_META,
  type Campaign,
  type SupportedObjective,
} from "@/lib/vidcica/campaign";

function objectiveLabel(objective: Campaign["objective"]): string {
  return OBJECTIVE_LABEL[objective as SupportedObjective] ?? objective;
}

function budgetLabel(c: Campaign): string {
  return c.budgetMode === "total" ? `${c.budgetTotal} € au total` : `${c.budgetDaily ?? 0} €/jour`;
}

function CampaignCard({ c }: { c: Campaign }) {
  const meta = STATUS_META[c.status];
  return (
    <Link href={`/ads/${c.id}`} data-testid={`campaign-${c.id}`} className="block">
      <Card className="hover:border-primary/40 flex flex-col gap-3 p-4 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium">{c.name}</span>
            <span className="text-muted-foreground text-xs">
              {objectiveLabel(c.objective)} · {budgetLabel(c)}
            </span>
          </div>
          <Badge variant={meta.variant} data-testid={`campaign-status-${c.id}`}>
            {meta.label}
          </Badge>
        </div>
        <div className="text-muted-foreground grid grid-cols-3 gap-2 text-xs">
          <Metric label="Impressions" value={c.metrics.impressions.toLocaleString("fr-FR")} />
          <Metric label="Clics" value={c.metrics.clicks.toLocaleString("fr-FR")} />
          <Metric label="Dépensé" value={`${c.metrics.budgetSpent.toFixed(2)} €`} />
        </div>
      </Card>
    </Link>
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
 * channel (the sync-ad-insights cron updates status/metrics). Honest empty state
 * routes to the boost flow.
 */
export function CampaignList({ userId, initial }: { userId: string; initial: Campaign[] }) {
  const campaigns = useCampaignsRealtime(userId, initial);

  if (campaigns.length === 0) {
    return (
      <div data-testid="ads-empty">
        <EmptyState
          className="py-16"
          title="Aucune campagne pour le moment"
          description="Transformez une de vos vidéos en publicité Facebook et Instagram en quelques étapes."
          action={
            <Link href="/ads/new" className={buttonVariants()}>
              Booster une vidéo
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" data-testid="campaign-list">
      {campaigns.map((c) => (
        <CampaignCard key={c.id} c={c} />
      ))}
    </div>
  );
}
