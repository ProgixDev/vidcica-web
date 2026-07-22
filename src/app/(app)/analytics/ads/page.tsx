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
      <div className="bg-card rounded-2xl border p-8">
        <EmptyState
          title={t("analytics.ads.empty.title")}
          description={t("analytics.ads.empty.body")}
          action={
            <Link href="/ads/new" className={buttonVariants({ className: "rounded-full" })}>
              {t("analytics.ads.empty.cta")}
            </Link>
          }
        />
      </div>
    );
  }

  const agg = aggregateCampaigns(campaigns);

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <h2 className="text-muted-foreground px-1 text-[11px] font-semibold tracking-widest uppercase">
          {t("analytics.ads.summary.title")}
        </h2>
        <div className="flex flex-wrap gap-2">
          <KpiTile
            brand
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

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-muted-foreground px-1 text-[11px] font-semibold tracking-widest uppercase">
            {t("analytics.ads.list.title")}
          </h2>
          <Link
            href="/ads/new"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "rounded-full" })}
          >
            {t("analytics.ads.empty.cta")}
          </Link>
        </div>
        <div className="bg-card divide-border/60 flex flex-col divide-y rounded-2xl border">
          {campaigns.map((c) => (
            <AdsCampaignRow key={c.id} t={t} campaign={c} />
          ))}
        </div>
      </section>

      <div className="bg-card rounded-2xl border p-5">
        <p className="text-sm font-semibold">{t("analytics.link.ads.title")}</p>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          {t("analytics.link.ads.body")}
        </p>
        <Link href="/ads" className={buttonVariants({ className: "mt-3 rounded-full" })}>
          {t("analytics.ads.openCampaigns")}
        </Link>
      </div>
    </div>
  );
}
