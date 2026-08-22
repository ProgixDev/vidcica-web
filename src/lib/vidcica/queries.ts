/**
 * Server-side, RLS-scoped reads for the video workspace. These run in Server
 * Components (first paint) via the cookie-session server client — RLS restricts
 * every row to `user_id = auth.uid()`, so no explicit user filter is needed.
 */
import "server-only";
import type { PlatformId } from "@/lib/vidcica/network";
import { createClient } from "@/lib/supabase/server";
import { rowToVideo, type Video } from "@/lib/vidcica/video";
import type { GenerationJobStatus } from "@/lib/vidcica/video";

export type LatestJob = {
  jobId: string;
  status: GenerationJobStatus;
  lastError: string | null;
};

/** Columns the workspace UI needs — keep in sync with rowToVideo. */
// `networks` and the engagement counters were missing here until 2026-08-22,
// so rowToVideo silently fell back to [] and 0 — the detail screen showed no
// "published on" row and a permanently empty Performance strip even when the
// database had real numbers. Any column the Video type exposes must be listed.
const VIDEO_COLUMNS =
  "id, title, description, thumbnail_url, video_url, status, format, duration_sec, hashtags, credits_used, networks, views, likes, comments, shares, created_at, updated_at";

/** All of the signed-in user's videos, newest first (RLS-scoped). */
export async function listMyVideos(): Promise<Video[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_COLUMNS)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => rowToVideo(r as Parameters<typeof rowToVideo>[0]));
}

/** One video by id, or null if it isn't the caller's (RLS filters it out). */
export async function getMyVideo(id: string): Promise<Video | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToVideo(data as Parameters<typeof rowToVideo>[0]);
}

/** The most recent generation job for a video (drives the render-progress view). */
export async function getLatestJob(videoId: string): Promise<LatestJob | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generation_jobs")
    .select("id, status, last_error")
    .eq("video_id", videoId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    jobId: data.id,
    status: data.status as GenerationJobStatus,
    lastError: data.last_error ?? null,
  };
}

export type PublishTarget = {
  platform: PlatformId;
  externalPostId: string | null;
};

/**
 * What a video is currently published to, plus the id needed to link to each
 * post. Excludes jobs the liveness cron has flagged as deleted, so this is
 * "live right now", not "was ever published".
 *
 * Deduped per platform, newest first — a republish after a removal leaves an
 * older succeeded row behind, and we want the current post, not the first one.
 */
export async function getPublishTargets(videoId: string): Promise<PublishTarget[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("publish_jobs")
    .select("platform, external_post_id, updated_at")
    .eq("video_id", videoId)
    .eq("status", "succeeded")
    .is("post_deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];

  const byPlatform = new Map<string, PublishTarget>();
  for (const row of data) {
    if (byPlatform.has(row.platform)) continue;
    byPlatform.set(row.platform, {
      platform: row.platform as PlatformId,
      externalPostId: row.external_post_id,
    });
  }
  return [...byPlatform.values()];
}
