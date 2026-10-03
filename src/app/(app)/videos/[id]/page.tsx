import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyVideo, getLatestJob, getPublishTargets } from "@/lib/vidcica/queries";
import { hasRenderedVideo } from "@/lib/vidcica/video";
import { RenderProgress, VideoDetail } from "@/features/videos";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/app-shell";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getT();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/videos/${id}`);

  const video = await getMyVideo(id);
  if (!video) notFound(); // not the caller's video (RLS) or doesn't exist

  const job = await getLatestJob(id);
  // Where it is live right now, with the post ids needed to link out. Only
  // fetched for a finished video — a draft or a render in progress has none.
  const targets = hasRenderedVideo(video) ? await getPublishTargets(id) : [];

  return (
    <>
      <PageHeader
        title={t("videos.detailTitle")}
        actions={
          <Link href="/videos" className={buttonVariants({ variant: "ghost" })}>
            ← {t("videos.title")}
          </Link>
        }
      />
      {/* The finished-video view lays itself out two-up on wide screens (a 9:16
          player is tall, so a single narrow column pushed every action below the
          fold while the right half of the page sat empty). It therefore manages
          its own width; only the narrow progress/draft states stay capped. */}
      {hasRenderedVideo(video) ? (
        <VideoDetail video={video} targets={targets} />
      ) : (
        <div className="w-full max-w-2xl">
          {job ? (
            <RenderProgress videoId={video.id} jobId={job.jobId} initialStatus={job.status} />
          ) : (
            <div className="bg-card flex flex-col gap-5 rounded-lg p-6">
              <p className="text-subtle-foreground text-[15px] leading-relaxed">
                {t("videos.draftNotGenerated")}
              </p>
              <Link href="/create" className={cn(buttonVariants(), "self-start")}>
                {t("videos.create")}
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}
