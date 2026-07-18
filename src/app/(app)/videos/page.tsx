import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listMyVideos } from "@/lib/vidcica/queries";
import { VideoList } from "@/features/videos";
import { PageHeader } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Bibliothèque" };
export const dynamic = "force-dynamic";

/** Full video library — the web counterpart of the app's «Vidéos» tab. */
export default async function VideosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/videos");

  const videos = await listMyVideos();

  return (
    <>
      <PageHeader
        title="Bibliothèque"
        subtitle={`${videos.length} vidéo${videos.length === 1 ? "" : "s"}`}
        actions={
          <Link href="/create" className={buttonVariants({ className: "rounded-full" })}>
            Créer une vidéo
          </Link>
        }
      />
      <VideoList userId={user.id} initial={videos} />
    </>
  );
}
