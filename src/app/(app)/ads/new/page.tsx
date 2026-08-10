import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listMyVideos } from "@/lib/vidcica/queries";
import { isReady } from "@/lib/vidcica/video";
import { BoostStoreProvider, BoostWizard, type VideoOption } from "@/features/ads";
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

  // Only finished videos can be boosted (Meta pulls the MP4).
  const videos: VideoOption[] = (await listMyVideos())
    .filter(isReady)
    .map((v) => ({ id: v.id, title: v.title }));

  // ?videoId= arrives from a video's "Booster" action. Resolve it against the
  // user's own ready videos rather than trusting the URL: an unknown or
  // someone else's id simply falls through to the normal picker instead of
  // seeding a draft that would fail at create time.
  const { videoId } = await searchParams;
  const preselected = videoId ? videos.find((v) => v.id === videoId) : undefined;

  return (
    <>
      <PageHeader
        title={t("ads.boostVideo")}
        actions={
          <Link href="/ads" className="text-muted-foreground hover:text-foreground text-sm">
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
          <BoostWizard videos={videos} />
        </BoostStoreProvider>
      </div>
    </>
  );
}
