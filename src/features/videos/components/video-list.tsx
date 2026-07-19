"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { STATUS_META, isRendering, type Video } from "@/lib/vidcica/video";
import { useVideosRealtime } from "@/lib/vidcica/use-videos-realtime";

/** Thumbnail that plays a muted preview on hover when the render is finished
 *  (like the landing showcase); static poster otherwise. */
function Thumb({ video }: { video: Video }) {
  if (!video.videoUrl) {
    return (
      <div
        aria-hidden
        className="bg-muted aspect-[9/16] w-full rounded-md bg-cover bg-center"
        style={video.thumbnailUrl ? { backgroundImage: `url(${video.thumbnailUrl})` } : undefined}
      />
    );
  }
  return (
    <video
      src={video.videoUrl}
      poster={video.thumbnailUrl ?? undefined}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      tabIndex={-1}
      className="bg-muted aspect-[9/16] w-full rounded-md object-cover"
      onMouseEnter={(e) => {
        e.currentTarget.muted = true;
        void e.currentTarget.play().catch(() => undefined);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.pause();
        e.currentTarget.currentTime = 0;
      }}
    />
  );
}

function VideoCard({ video }: { video: Video }) {
  const meta = STATUS_META[video.status];
  return (
    <Link
      href={`/videos/${video.id}`}
      className="focus-visible:ring-ring group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      data-testid="video-card"
    >
      <div className="bg-card group-hover:border-foreground/20 flex flex-col gap-3 rounded-xl border p-3 transition-colors">
        <div className="relative">
          <Thumb video={video} />
          <Badge
            variant={meta.variant}
            className="absolute top-2 left-2"
            data-testid="video-status"
          >
            {isRendering(video.status) ? (
              <span className="bg-primary-foreground/80 size-1.5 animate-pulse rounded-full" />
            ) : null}
            {meta.label}
          </Badge>
          {video.durationSec > 0 ? (
            <span
              aria-hidden
              className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-2.5">
                <path d="M8 5.5v13l11-6.5-11-6.5Z" />
              </svg>
              {Math.round(video.durationSec)} s
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="truncate text-sm font-medium">{video.title}</p>
          <p className="text-muted-foreground text-xs">
            {video.format} · {Math.round(video.durationSec)} s
          </p>
        </div>
      </div>
    </Link>
  );
}

/**
 * Dashboard video grid, seeded server-side (RLS-scoped) and kept live via the
 * videos realtime channel. Renders a real empty state when there are none.
 */
export function VideoList({ userId, initial }: { userId: string; initial: Video[] }) {
  const videos = useVideosRealtime(userId, initial);

  if (videos.length === 0) {
    return (
      <EmptyState
        className="py-20"
        title="Aucune vidéo pour le moment"
        description="Transformez un script en vidéo verticale prête à publier. Votre première création prend moins d’une minute."
        action={
          <Link href="/create" className={buttonVariants()}>
            Créer une vidéo
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" data-testid="video-grid">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}
