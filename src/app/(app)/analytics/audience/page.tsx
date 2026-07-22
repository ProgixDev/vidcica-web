import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { getAnalyticsBundle } from "@/lib/vidcica/analytics-queries";
import { type FollowerRow } from "@/lib/vidcica/analytics";
import { PLATFORMS } from "@/lib/vidcica/network";
import {
  PlatformShareList,
  GenderSplit,
  BarBreakdown,
  HeatmapHours,
  DataComingNotice,
  type PlatformShareRow,
} from "@/features/analytics";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("analytics.audience.metaTitle") };
}
export const dynamic = "force-dynamic";

/** Age buckets — numeric labels (language-neutral), rendered at honest 0 % until
 *  demographic collection lands. */
const AGE_BUCKETS = ["18–24", "25–34", "35–44", "45–54", "55+"];

// Range is carried in the URL for the nav strip; the audience view has no
// time-series yet, so it doesn't read the range param.
export default async function AnalyticsAudiencePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/analytics/audience");

  const [t, bundle] = await Promise.all([getT(), getAnalyticsBundle()]);

  const connected = bundle.networks.filter((n) => n.connected);

  if (connected.length === 0) {
    return (
      <div className="bg-card rounded-2xl border p-8">
        <EmptyState
          title={t("analytics.audience.empty.title")}
          description={t("analytics.audience.empty.body")}
          action={
            <Link href="/networks" className={buttonVariants({ className: "rounded-full" })}>
              {t("analytics.audience.empty.cta")}
            </Link>
          }
        />
      </div>
    );
  }

  const labelOf = new Map(PLATFORMS.map((p) => [p.id, p.label]));
  const followers: FollowerRow[] = connected.map((n) => ({
    platform: n.platform,
    label: labelOf.get(n.platform) ?? n.platform,
    followers: n.followers ?? 0,
  }));
  const totalFollowers = followers.reduce((a, r) => a + r.followers, 0);
  const shareRows: PlatformShareRow[] = followers.map((r) => ({
    platform: r.platform,
    value: r.followers,
    share: totalFollowers > 0 ? r.followers / totalFollowers : 0,
  }));

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <h2 className="text-muted-foreground px-1 text-[11px] font-semibold tracking-widest uppercase">
          {t("analytics.audience.followers.title")}
        </h2>
        <PlatformShareList rows={shareRows} />
      </section>

      <DataComingNotice
        title={t("analytics.audience.demographics.title")}
        body={t("analytics.noData.collection")}
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-muted-foreground px-1 text-[11px] font-semibold tracking-widest uppercase">
          {t("analytics.audience.gender.title")}
        </h2>
        <div className="bg-card rounded-2xl border p-4">
          <GenderSplit t={t} female={0} male={0} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-muted-foreground px-1 text-[11px] font-semibold tracking-widest uppercase">
          {t("analytics.audience.age.title")}
        </h2>
        <div className="bg-card rounded-2xl border p-4">
          <BarBreakdown items={AGE_BUCKETS.map((label) => ({ label, share: 0 }))} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-muted-foreground px-1 text-[11px] font-semibold tracking-widest uppercase">
          {t("analytics.audience.hours.title")}
        </h2>
        <div className="bg-card rounded-2xl border p-4">
          <HeatmapHours t={t} cells={[]} />
        </div>
      </section>
    </div>
  );
}
