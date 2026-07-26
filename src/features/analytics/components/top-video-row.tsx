import Link from "next/link";
import { PlatformIcon } from "@/components/platform-icon";
import { formatDate, formatNumber } from "@/lib/format";
import type { PlatformId } from "@/lib/vidcica/network";
import type { Video } from "@/lib/vidcica/video";

export type TopVideoRowProps = {
  video: Video;
  /** Platform this video targets, if known (drives the row icon). */
  platform?: PlatformId;
};

/**
 * Dense published-video row. Shows collected views + likes when the metrics
 * collector has populated them, otherwise falls back to the publish date. Links
 * to the video detail page. Pure / server-renderable.
 */
export function TopVideoRow({ video, platform }: TopVideoRowProps) {
  const hasEngagement = video.views > 0 || video.likes > 0;
  return (
    <Link
      href={`/videos/${video.id}`}
      className="hover:bg-muted/60 flex items-center gap-3 px-4 py-2.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
      data-testid={`analytics-video-${video.id}`}
    >
      <span className="bg-muted relative h-14 w-10 shrink-0 overflow-hidden rounded-md">
        {video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{video.title}</span>
        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
          {platform ? <PlatformIcon platform={platform} size={14} /> : null}
          {hasEngagement ? (
            <span className="flex items-center gap-2.5">
              <span className="flex items-center gap-1" title="Vues">
                <EyeIcon />
                {formatNumber(video.views)}
              </span>
              <span className="flex items-center gap-1" title="J’aime">
                <HeartIcon />
                {formatNumber(video.likes)}
              </span>
            </span>
          ) : (
            <span className="truncate">{formatDate(new Date(video.updatedAt))}</span>
          )}
        </span>
      </span>
    </Link>
  );
}

function EyeIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}
