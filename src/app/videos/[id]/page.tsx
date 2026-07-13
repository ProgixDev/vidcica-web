import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyVideo, getLatestJob } from "@/lib/vidcica/queries";
import { isReady } from "@/lib/vidcica/video";
import { RenderProgress, VideoDetail } from "@/features/videos";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/videos/${id}`);

  const video = await getMyVideo(id);
  if (!video) notFound(); // not the caller's video (RLS) or doesn't exist

  const job = await getLatestJob(id);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Votre vidéo</h1>
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground text-sm">
          ← Mes vidéos
        </Link>
      </header>

      {isReady(video) ? (
        <VideoDetail video={video} />
      ) : job ? (
        <RenderProgress videoId={video.id} jobId={job.jobId} initialStatus={job.status} />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">Ce brouillon n’a pas encore été généré.</p>
          <Link href="/create" className={cn(buttonVariants(), "self-start")}>
            Créer une vidéo
          </Link>
        </div>
      )}
    </main>
  );
}
