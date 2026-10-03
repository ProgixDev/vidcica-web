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
      className="hover:bg-accent focus-visible:bg-accent flex min-h-16 items-center gap-4 px-5 py-3 transition-colors outline-none"
      data-testid={`analytics-campaign-${campaign.id}`}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-semibold">{campaign.name}</span>
        <span className="text-muted-foreground truncate text-[13px] tabular-nums">
          {t("analytics.ads.row.budget", {
            spent: formatNumber(campaign.metrics.budgetSpent),
            total: formatNumber(campaign.budgetTotal),
          })}
        </span>
      </span>
      <Badge variant={meta.variant} className="shrink-0">
        {t(CAMPAIGN_STATUS_KEY[campaign.status])}
      </Badge>
    </Link>
  );
}
