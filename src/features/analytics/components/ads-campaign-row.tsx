import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";
import { CAMPAIGN_STATUS_KEY, STATUS_META, type Campaign } from "@/lib/vidcica/campaign";
import type { TFunction } from "@/lib/i18n";

export type AdsCampaignRowProps = {
  t: TFunction;
  campaign: Campaign;
};

/**
 * Compact campaign row for the ads analytics screen — name, status, spend vs
 * budget (real, cron-written). Deep-links to the campaign detail. Pure /
 * server-renderable. No fabricated ROAS: metrics are honest cron values.
 */
export function AdsCampaignRow({ t, campaign }: AdsCampaignRowProps) {
  const meta = STATUS_META[campaign.status];
  return (
    <Link
      href={`/ads/${campaign.id}`}
      className="hover:bg-muted/60 flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
      data-testid={`analytics-campaign-${campaign.id}`}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{campaign.name}</span>
          <Badge variant={meta.variant}>{t(CAMPAIGN_STATUS_KEY[campaign.status])}</Badge>
        </span>
        <span className="text-muted-foreground truncate text-xs">
          {t("analytics.ads.row.budget", {
            spent: formatNumber(campaign.metrics.budgetSpent),
            total: formatNumber(campaign.budgetTotal),
          })}
        </span>
      </span>
      <span className="text-muted-foreground shrink-0" aria-hidden>
        ›
      </span>
    </Link>
  );
}
