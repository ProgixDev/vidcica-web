import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listMyVideos } from "@/lib/vidcica/queries";
import { isReady } from "@/lib/vidcica/video";
import { BoostStoreProvider, BoostWizard, type VideoOption } from "@/features/ads";

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
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Booster une vidéo</h1>
        <Link href="/ads" className="text-muted-foreground hover:text-foreground text-sm">
          ← Mes publicités
        </Link>
      </header>
      <BoostStoreProvider>
        <BoostWizard videos={videos} />
      </BoostStoreProvider>
    </main>
  );
}
