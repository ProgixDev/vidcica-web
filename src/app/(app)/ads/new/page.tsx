import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listMyVideos } from "@/lib/vidcica/queries";
import { isReady } from "@/lib/vidcica/video";
import { BoostStoreProvider, BoostWizard, type VideoOption } from "@/features/ads";
import { PageHeader } from "@/components/app-shell";

export const metadata = { title: "Booster une vidéo" };
export const dynamic = "force-dynamic";

export default async function BoostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/ads/new");

  // Only finished videos can be boosted (Meta pulls the MP4).
  const videos: VideoOption[] = (await listMyVideos())
    .filter(isReady)
    .map((v) => ({ id: v.id, title: v.title }));

  return (
    <>
      <PageHeader
        title="Booster une vidéo"
        actions={
          <Link href="/ads" className="text-muted-foreground hover:text-foreground text-sm">
            ← Mes publicités
          </Link>
        }
      />
      <div className="w-full max-w-2xl">
        <BoostStoreProvider>
          <BoostWizard videos={videos} />
        </BoostStoreProvider>
      </div>
    </>
  );
}
