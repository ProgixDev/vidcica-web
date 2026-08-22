/**
 * Shared Vidcica video domain type + row mapper. Lives in `lib` (not a feature)
 * because auth/videos/create all need it and features may not import each other.
 * A web-native subset of the mobile `Video` entity + `rowToVideo`
 * (ClipFlow/src/lib/db-mappers.ts) — only the fields the P0 workspace renders.
 */
import type { Database } from "@/lib/supabase/database.types";
import type { MessageKey } from "@/lib/i18n";
import type { PlatformId } from "@/lib/vidcica/network";

export type VideoRow = Database["public"]["Tables"]["videos"]["Row"];

/** Backend `videos.status` lifecycle (FR values, from the mobile schema). */
export type VideoStatus =
  | "brouillon" // draft
  | "generating"
  | "assembling" // some rows use this transient render label
  | "pret" // ready
  | "programme" // scheduled
  | "publishing"
  | "publie"; // published

/** `generation_jobs.status` render stages. */
export type GenerationJobStatus =
  | "queued"
  | "footage"
  | "voiceover"
  | "assembling"
  | "succeeded"
  | "failed"
  | "cancelled";

export type Video = {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string | null;
  videoUrl?: string;
  status: VideoStatus;
  format: string;
  durationSec: number;
  hashtags: string[];
  creditsUsed?: number;
  /** Platforms the video is published to (empty until published). */
  networks: PlatformId[];
  /** Cross-platform engagement, populated by the sync-video-metrics collector.
   *  0 when nothing has been collected yet (honest — a real 0 and "not yet
   *  collected" are indistinguishable at the rolled-up column, so screens gate on
   *  publish state, not on these being non-zero). */
  views: number;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
};

/** Pure row → domain mapper. Only own rows reach here (RLS `user_id = auth.uid()`). */
export function rowToVideo(r: VideoRow): Video {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    thumbnailUrl: r.thumbnail_url,
    videoUrl: r.video_url ?? undefined,
    status: r.status as VideoStatus,
    format: r.format,
    durationSec: r.duration_sec,
    hashtags: r.hashtags,
    creditsUsed: r.credits_used ?? undefined,
    networks: (r.networks ?? []) as PlatformId[],
    views: r.views ?? 0,
    likes: r.likes ?? 0,
    comments: r.comments ?? 0,
    shares: r.shares ?? 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** Is the video mid-render (dashboard shows a live/animated badge)? */
export function isRendering(status: VideoStatus): boolean {
  return status === "generating" || status === "assembling";
}

/** Does the video have a downloadable finished file? */
export function isReady(v: Pick<Video, "status" | "videoUrl">): boolean {
  return v.status === "pret" && !!v.videoUrl;
}

/**
 * True when the render finished and a playable file exists — regardless of what
 * has happened to the video since.
 *
 * `isReady` means the narrower "rendered AND not yet published", which is right
 * for counting what's waiting to go out. Using it to decide whether to SHOW a
 * video was a bug: `publie`, `programme` and `publishing` rows all carry a
 * perfectly good `videoUrl`, so the detail page fell through to the
 * render-progress branch and a published video became unwatchable and
 * unmanageable — no player, no download, no delete. Same for the publish page,
 * which bounced you away from re-publishing to a second platform.
 */
export function hasRenderedVideo(v: Pick<Video, "status" | "videoUrl">): boolean {
  return !!v.videoUrl && !isRendering(v.status) && v.status !== "brouillon";
}

/** Badge presentation per status: FR label + shadcn role token variant. */
export const STATUS_META: Record<
  VideoStatus,
  { label: string; variant: "muted" | "brand" | "success" | "warning" }
> = {
  brouillon: { label: "Brouillon", variant: "muted" },
  generating: { label: "Génération…", variant: "brand" },
  assembling: { label: "Assemblage…", variant: "brand" },
  pret: { label: "Prêt", variant: "success" },
  programme: { label: "Programmé", variant: "warning" },
  publishing: { label: "Publication…", variant: "brand" },
  publie: { label: "Publié", variant: "success" },
};

/** i18n key for each status label (use `t(VIDEO_STATUS_KEY[status])`; take the
 *  badge `variant` from STATUS_META). */
export const VIDEO_STATUS_KEY: Record<VideoStatus, MessageKey> = {
  brouillon: "video.status.brouillon",
  generating: "video.status.generating",
  assembling: "video.status.assembling",
  pret: "video.status.pret",
  programme: "video.status.programme",
  publishing: "video.status.publishing",
  publie: "video.status.publie",
};

/** YouTube's own ceiling for Shorts. */
export const YOUTUBE_SHORT_MAX_SECONDS = 180;

/**
 * Can YouTube classify this video as a Short?
 *
 * The Data API has NO "upload as a Short" parameter -- YouTube decides from the
 * file itself: vertical (or square) aspect ratio AND at most 3 minutes. Our
 * `asShort` option only appends #Shorts to the description and formats the
 * outgoing link, so offering it for a landscape video promises something we
 * cannot deliver: it uploads as an ordinary video and the /shorts/ URL simply
 * redirects. Reported 2026-08-22 after a 16:9 video published "as a Short"
 * appeared as a normal video.
 */
export function canBeYouTubeShort(v: Pick<Video, "format" | "durationSec">): boolean {
  if (v.durationSec > YOUTUBE_SHORT_MAX_SECONDS) return false;
  const parts = v.format.split(":");
  const w = Number.parseInt(parts[0] ?? "", 10);
  const h = Number.parseInt(parts[1] ?? "", 10);
  // Unparseable format -> don't block the user on our own uncertainty.
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return true;
  return h >= w; // vertical or square
}
