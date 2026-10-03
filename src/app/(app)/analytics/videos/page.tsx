import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { getAnalyticsBundle } from "@/lib/vidcica/analytics-queries";
import { deriveAnalytics, buildTopVideos, parseRange } from "@/lib/vidcica/analytics";
import { TopVideoRow, DataComingNotice } from "@/features/analytics";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("analytics.videos.metaTitle") };
}
export const dynamic = "force-dynamic";

export default async function AnalyticsVideosPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/analytics/videos");

  const [t, bundle, params] = await Promise.all([getT(), getAnalyticsBundle(), searchParams]);
  const range = parseRange(params.range);
  const derived = deriveAnalytics({ range, ...bundle });
  const rows = buildTopVideos(derived.publishedVideos, 20);

  if (rows.length === 0) {
    return (
      <div>
        <EmptyState
          className="py-16"
          title={t("analytics.videos.empty.title")}
          description={t("analytics.videos.empty.body")}
          action={
            <Link href="/create" className={buttonVariants()}>
              {t("analytics.videos.empty.cta")}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <DataComingNotice
        title={t("analytics.overview.dataComing.title")}
        body={t("analytics.noData.collection")}
      />
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("analytics.section.published")}</h2>
        <div className="bg-card divide-border flex flex-col divide-y overflow-hidden rounded-lg">
          {rows.map((row) => (
            <TopVideoRow key={row.video.id} video={row.video} platform={row.platform} />
          ))}
        </div>
      </section>
    </div>
  );
}
