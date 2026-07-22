/**
 * Shared Vidcica video domain type + row mapper. Lives in `lib` (not a feature)
 * because auth/videos/create all need it and features may not import each other.
 * A web-native subset of the mobile `Video` entity + `rowToVideo`
 * (ClipFlow/src/lib/db-mappers.ts) — only the fields the P0 workspace renders.
 */
import type { Database } from "@/lib/supabase/database.types";
import type { MessageKey } from "@/lib/i18n";

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
