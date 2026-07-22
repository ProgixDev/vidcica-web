import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { formatNumber } from "@/lib/format";
import { getAnalyticsBundle } from "@/lib/vidcica/analytics-queries";
import { deriveAnalytics, buildTopVideos, parseRange } from "@/lib/vidcica/analytics";
import { AnalyticsHero, KpiTile, TopVideoRow, DataComingNotice } from "@/features/analytics";
import { ProfileSection, ProfileLinkRow } from "@/features/profile";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("analytics.metaTitle") };
}
export const dynamic = "force-dynamic";

export default async function AnalyticsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/analytics");

  const [t, bundle, params] = await Promise.all([getT(), getAnalyticsBundle(), searchParams]);
  const range = parseRange(params.range);
  const derived = deriveAnalytics({ range, ...bundle });
  const topVideos = buildTopVideos(derived.publishedVideos, 5);
  const isEmpty = derived.publishedVideos.length === 0 && bundle.campaigns.length === 0;

  if (isEmpty) {
    return (
      <div className="bg-card rounded-2xl border p-8">
        <EmptyState
          title={t("analytics.overview.empty.title")}
          description={t("analytics.overview.empty.body")}
          action={
            <Link href="/create" className={buttonVariants({ className: "rounded-full" })}>
              {t("analytics.overview.empty.cta")}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <AnalyticsHero
        t={t}
        value={formatNumber(derived.totals.views)}
        delta={derived.delta}
        series={derived.series}
        publishedCount={derived.publishedVideos.length}
        days={derived.days}
      />

      <DataComingNotice
        title={t("analytics.overview.dataComing.title")}
        body={t("analytics.noData.collection")}
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-muted-foreground px-1 text-[11px] font-semibold tracking-widest uppercase">
          {t("analytics.section.kpis")}
        </h2>
        <div className="flex flex-wrap gap-2">
          <KpiTile
            brand
            label={t("analytics.kpi.publishedVideos")}
            value={String(derived.publishedVideos.length)}
            testId="kpi-published"
          />
          <KpiTile
            label={t("analytics.kpi.followers")}
            value={formatNumber(derived.totals.followers)}
            testId="kpi-followers"
          />
          <KpiTile
            label={t("analytics.kpi.leads")}
            value={formatNumber(derived.totals.leads)}
            testId="kpi-leads"
          />
          <KpiTile
            label={t("analytics.kpi.adSpend")}
            value={`${formatNumber(derived.totals.adSpend)} €`}
            testId="kpi-adspend"
          />
        </div>
      </section>

      {topVideos.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-muted-foreground px-1 text-[11px] font-semibold tracking-widest uppercase">
            {t("analytics.section.published")}
          </h2>
          <div className="bg-card divide-border/60 flex flex-col divide-y rounded-2xl border">
            {topVideos.map((row) => (
              <TopVideoRow key={row.video.id} video={row.video} platform={row.platform} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-muted-foreground px-1 text-[11px] font-semibold tracking-widest uppercase">
          {t("analytics.overview.exploreTitle")}
        </h2>
        <ProfileSection>
          <ProfileLinkRow
            href={`/analytics/videos?range=${range}`}
            label={t("analytics.tabs.videos")}
            hint={t("analytics.link.videos.body")}
            testId="analytics-link-videos"
          />
          <ProfileLinkRow
            href={`/analytics/audience?range=${range}`}
            label={t("analytics.tabs.audience")}
            hint={t("analytics.link.audience.body")}
            testId="analytics-link-audience"
          />
          <ProfileLinkRow
            href={`/analytics/ads?range=${range}`}
            label={t("analytics.tabs.ads")}
            hint={t("analytics.link.ads.body")}
            testId="analytics-link-ads"
          />
        </ProfileSection>
      </section>
    </div>
  );
}
