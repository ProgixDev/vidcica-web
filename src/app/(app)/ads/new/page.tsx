import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listMyVideos } from "@/lib/vidcica/queries";
import { getMyEntitlement } from "@/lib/vidcica/billing-queries";
import { TIERS } from "@/lib/vidcica/tiers";
import { hasMetaReviewAccess, isPublishingPlatformEnabled } from "@/lib/vidcica/network";
import { env } from "@/core/env";
import {
  BoostPlanPrompt,
  BoostStoreProvider,
  BoostWizard,
  boostOptions,
  type VideoOption,
} from "@/features/ads";
import { PageHeader } from "@/components/app-shell";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("ads.boostVideo") };
}
export const dynamic = "force-dynamic";

export default async function BoostPage({
  searchParams,
}: {
  searchParams: Promise<{ videoId?: string }>;
}) {
  const t = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/ads/new");

  // Boost is a Pro/Studio feature, enforced by the server (create-ad-campaign
  // and set-campaign-status answer 403 plan_required). Say so up front instead
  // of letting someone fill five steps for nothing.
  const { plan } = await getMyEntitlement();
  if (!TIERS[plan].ads) {
    return (
      <>
        <PageHeader title={t("ads.boostVideo")} />
        <div className="w-full max-w-2xl">
          <BoostPlanPrompt />
        </div>
      </>
    );
  }

  // Can this account connect Facebook today? Read server-side: the App Review
  // allowlist (META_REVIEW_EMAILS) must never reach the browser.
  const canConnectMeta = isPublishingPlatformEnabled(
    "facebook",
    hasMetaReviewAccess(user.email, env.META_REVIEW_EMAILS),
  );

  // Any video with a finished file can be boosted, published or not (Meta
  // pulls the MP4); see boostOptions.
  const videos: VideoOption[] = boostOptions(await listMyVideos());

  // ?videoId= arrives from a video's "Booster" action. Resolve it against the
  // user's own boostable videos rather than trusting the URL: an unknown or
  // someone else's id simply falls through to the normal picker instead of
  // seeding a draft that would fail at create time.
  const { videoId } = await searchParams;
  const preselected = videoId ? videos.find((v) => v.id === videoId) : undefined;

  return (
    <>
      <PageHeader
        title={t("ads.boostVideo")}
        actions={
          <Link
            href="/ads"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background self-start rounded-full text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            ← {t("ads.myAds")}
          </Link>
        }
      />
      <div className="w-full max-w-2xl">
        <BoostStoreProvider
          initialVideoId={preselected?.id}
          initialName={preselected ? t("ads.boostName", { title: preselected.title }) : undefined}
          initialStep={preselected ? 1 : 0}
        >
          <BoostWizard videos={videos} canConnectMeta={canConnectMeta} />
        </BoostStoreProvider>
      </div>
    </>
  );
}
