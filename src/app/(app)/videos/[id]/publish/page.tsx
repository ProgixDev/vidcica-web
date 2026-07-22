import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyVideo } from "@/lib/vidcica/queries";
import { listMyNetworks } from "@/lib/vidcica/networks-queries";
import { isReady } from "@/lib/vidcica/video";
import { PLATFORMS, networkStatus } from "@/lib/vidcica/network";
import { PublishStoreProvider, PublishFlow, type PublishablePlatform } from "@/features/publish";
import { PageHeader } from "@/components/app-shell";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("publish.metaTitle") };
}
export const dynamic = "force-dynamic";

export default async function PublishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/videos/${id}/publish`);

  const video = await getMyVideo(id);
  if (!video) notFound();
  // Only a finished video can be published.
  if (!isReady(video)) redirect(`/videos/${id}`);

  const networks = await listMyNetworks();
  const byPlatform = new Map(networks.map((n) => [n.platform, n]));

  // Every connectable platform is shown (X is dropped — provider null), each
  // with its connection state, so an unconnected YouTube still appears (with a
  // "Connecter" affordance) instead of vanishing from the picker.
  const platforms: PublishablePlatform[] = PLATFORMS.filter((p) => p.provider !== null).map((p) => {
    const net = byPlatform.get(p.id);
    return {
      id: p.id,
      label: p.label,
      status: networkStatus(p, net),
      handle: net?.handle,
    };
  });

  return (
    <>
      <PageHeader
        title={t("publish.pageTitle", { title: video.title })}
        subtitle={t("publish.pageSubtitle")}
        actions={
          <Link
            href={`/videos/${id}`}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← {t("common.back")}
          </Link>
        }
      />
      <div className="w-full max-w-4xl">
        <PublishStoreProvider videoId={video.id}>
          <PublishFlow
            userId={user.id}
            platforms={platforms}
            video={{
              id: video.id,
              title: video.title,
              description: video.description,
              hashtags: video.hashtags,
              thumbnailUrl: video.thumbnailUrl,
              durationSec: video.durationSec,
              format: video.format,
            }}
          />
        </PublishStoreProvider>
      </div>
    </>
  );
}
