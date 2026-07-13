import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyVideo } from "@/lib/vidcica/queries";
import { listMyNetworks } from "@/lib/vidcica/networks-queries";
import { isReady } from "@/lib/vidcica/video";
import { PLATFORMS } from "@/lib/vidcica/network";
import { PublishStoreProvider, PublishFlow } from "@/features/publish";

export const metadata = { title: "Publier" };
export const dynamic = "force-dynamic";

export default async function PublishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  const publishable = new Set(
    networks.filter((n) => n.connected && n.publishesEnabled).map((n) => n.platform),
  );
  const available = PLATFORMS.filter((p) => publishable.has(p.id));

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Publier « {video.title} »</h1>
        <Link
          href={`/videos/${id}`}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Retour
        </Link>
      </header>
      <PublishStoreProvider videoId={video.id}>
        <PublishFlow userId={user.id} available={available} />
      </PublishStoreProvider>
    </main>
  );
}
