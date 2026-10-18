import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  CAMPAIGN_STATUS_KEY,
  STATUS_META,
  formatAdMoney,
  type Campaign,
} from "@/lib/vidcica/campaign";
import type { TFunction } from "@/lib/i18n";

export type AdsCampaignRowProps = {
  t: TFunction;
  campaign: Campaign;
  /** The ad account’s currency: Meta bills and reports spend in it. */
  currency?: string;
  /** Intl locale for the amounts. */
  moneyLocale?: string;
};

/**
 * Compact campaign row for the ads analytics screen — name, status, spend vs
 * budget (real, cron-written). Deep-links to the campaign detail. Pure /
 * server-renderable. No fabricated ROAS: metrics are honest cron values.
 */
export function AdsCampaignRow({
  t,
  campaign,
  currency = "EUR",
  moneyLocale = "fr-FR",
}: AdsCampaignRowProps) {
  const meta = STATUS_META[campaign.status];
  const money = (n: number) => formatAdMoney(n, campaign.currency ?? currency, moneyLocale);
  return (
    <Link
      href={`/ads/${campaign.id}`}
      className="hover:bg-accent focus-visible:bg-accent flex min-h-16 items-center gap-4 px-5 py-3 transition-colors outline-none"
      data-testid={`analytics-campaign-${campaign.id}`}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-semibold">{campaign.name}</span>
        <span className="text-muted-foreground truncate text-[13px] tabular-nums">
          {campaign.budgetMode === "total"
            ? t("analytics.ads.row.budget", {
                spent: money(campaign.metrics.budgetSpent),
                total: money(campaign.budgetTotal),
              })
            : t("analytics.ads.row.budgetDaily", {
                spent: money(campaign.metrics.budgetSpent),
                daily: money(campaign.budgetDaily ?? 0),
              })}
        </span>
      </span>
      <Badge variant={meta.variant} className="shrink-0">
        {t(CAMPAIGN_STATUS_KEY[campaign.status])}
      </Badge>
    </Link>
  );
}
