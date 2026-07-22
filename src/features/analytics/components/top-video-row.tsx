import Link from "next/link";
import { PlatformIcon } from "@/components/platform-icon";
import { formatDate } from "@/lib/format";
import type { PlatformId } from "@/lib/vidcica/network";
import type { Video } from "@/lib/vidcica/video";

export type TopVideoRowProps = {
  video: Video;
  /** Platform this video targets, if known (drives the row icon). */
  platform?: PlatformId;
};

/**
 * Dense published-video row. Per-video reach/engagement has no source yet, so the
 * row shows the publish date + (optional) platform instead of invented metrics.
 * Links to the video detail page. Pure / server-renderable.
 */
export function TopVideoRow({ video, platform }: TopVideoRowProps) {
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
          <span className="truncate">{formatDate(new Date(video.updatedAt))}</span>
        </span>
      </span>
    </Link>
  );
}
