import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { formatNumber } from "@/lib/format";
import { getAnalyticsBundle } from "@/lib/vidcica/analytics-queries";
import { aggregateCampaigns } from "@/lib/vidcica/analytics";
import { KpiTile, AdsCampaignRow, DataComingNotice } from "@/features/analytics";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("analytics.ads.metaTitle") };
}
export const dynamic = "force-dynamic";

// Ad metrics are lifetime cumulative (Meta `sync-ad-insights` cron); there is no
// per-range time-series yet, so this view doesn't read the range param.
export default async function AnalyticsAdsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/analytics/ads");

  const [t, bundle] = await Promise.all([getT(), getAnalyticsBundle()]);

  const { campaigns } = bundle;

  if (campaigns.length === 0) {
    return (
      <div>
        <EmptyState
          className="py-16"
          title={t("analytics.ads.empty.title")}
          description={t("analytics.ads.empty.body")}
          action={
            <Link href="/ads/new" className={buttonVariants()}>
              {t("analytics.ads.empty.cta")}
            </Link>
          }
        />
      </div>
    );
  }

  const agg = aggregateCampaigns(campaigns);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("analytics.ads.summary.title")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <KpiTile
            label={t("analytics.kpi.adSpend")}
            value={`${formatNumber(agg.totalSpend)} €`}
            testId="ads-kpi-spend"
          />
          <KpiTile
            label={t("analytics.kpi.leads")}
            value={formatNumber(agg.totalLeads)}
            testId="ads-kpi-leads"
          />
          <KpiTile
            label={t("analytics.kpi.reach")}
            value={formatNumber(agg.totalReach)}
            testId="ads-kpi-reach"
          />
          <KpiTile
            label={t("analytics.kpi.impressions")}
            value={formatNumber(agg.totalImpressions)}
            testId="ads-kpi-impressions"
          />
          <KpiTile
            label={t("analytics.kpi.clicks")}
            value={formatNumber(agg.totalClicks)}
            testId="ads-kpi-clicks"
          />
          <KpiTile
            label={t("analytics.kpi.cpl")}
            value={agg.cpl > 0 ? `${agg.cpl.toFixed(2)} €` : "—"}
            testId="ads-kpi-cpl"
          />
        </div>
      </section>

      {!agg.hasMetrics ? <DataComingNotice body={t("analytics.ads.metricsEmpty")} /> : null}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">{t("analytics.ads.list.title")}</h2>
          <Link href="/ads/new" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            {t("analytics.ads.empty.cta")}
          </Link>
        </div>
        <div className="bg-card divide-border flex flex-col divide-y overflow-hidden rounded-lg">
          {campaigns.map((c) => (
            <AdsCampaignRow key={c.id} t={t} campaign={c} />
          ))}
        </div>
      </section>

      <div className="bg-card flex flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-lg p-6">
        <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
          <p className="text-[15px] font-semibold">{t("analytics.link.ads.title")}</p>
          <p className="text-muted-foreground text-[13px] leading-relaxed">
            {t("analytics.link.ads.body")}
          </p>
        </div>
        <Link href="/ads" className={buttonVariants({ variant: "secondary" })}>
          {t("analytics.ads.openCampaigns")}
        </Link>
      </div>
    </div>
  );
}
