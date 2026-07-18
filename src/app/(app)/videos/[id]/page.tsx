import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyVideo, getLatestJob } from "@/lib/vidcica/queries";
import { isReady } from "@/lib/vidcica/video";
import { RenderProgress, VideoDetail } from "@/features/videos";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/app-shell";

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
    <>
      <PageHeader
        title="Votre vidéo"
        actions={
          <Link href="/videos" className="text-muted-foreground hover:text-foreground text-sm">
            ← Bibliothèque
          </Link>
        }
      />
      <div className="w-full max-w-2xl">
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
      </div>
    </>
  );
}
