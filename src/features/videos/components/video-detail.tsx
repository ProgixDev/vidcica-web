"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STATUS_META, VIDEO_STATUS_KEY, type Video } from "@/lib/vidcica/video";
import { useT } from "@/lib/i18n/provider";

/**
 * Finished-video surface: plays the rendered MP4 and offers a download
 * (AC-14). The download anchor points at the finished media URL with the
 * `download` attribute so the browser saves the file.
 */
export function VideoDetail({ video }: { video: Video }) {
  const t = useT();
  const meta = STATUS_META[video.status];
  return (
    <div className="flex flex-col gap-5" data-testid="video-detail">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{video.title}</h2>
        <Badge variant={meta.variant}>{t(VIDEO_STATUS_KEY[video.status])}</Badge>
      </div>

      {video.videoUrl ? (
        <video
          controls
          playsInline
          src={video.videoUrl}
          poster={video.thumbnailUrl ?? undefined}
          className="bg-muted mx-auto aspect-[9/16] max-h-[70dvh] w-auto rounded-xl"
          data-testid="video-player"
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {video.videoUrl ? (
          <a
            href={video.videoUrl}
            download
            className={buttonVariants({ variant: "default" })}
            data-testid="download-btn"
          >
            {t("videos.downloadMp4")}
          </a>
        ) : null}
        <Link
          href={`/videos/${video.id}/publish`}
          className={buttonVariants({ variant: "outline" })}
          data-testid="publish-link"
        >
          {t("common.publish")}
        </Link>
        <span className="text-muted-foreground text-xs">
          {t("videos.formatDuration", { format: video.format, n: Math.round(video.durationSec) })}
        </span>
      </div>
    </div>
  );
}
