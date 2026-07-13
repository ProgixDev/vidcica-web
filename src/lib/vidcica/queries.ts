/**
 * Server-side, RLS-scoped reads for the video workspace. These run in Server
 * Components (first paint) via the cookie-session server client — RLS restricts
 * every row to `user_id = auth.uid()`, so no explicit user filter is needed.
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { rowToVideo, type Video } from "@/lib/vidcica/video";
import type { GenerationJobState } from "@/lib/vidcica/generation";
import type { GenerationJobStatus } from "@/lib/vidcica/video";

/** Columns the workspace UI needs — keep in sync with rowToVideo. */
const VIDEO_COLUMNS =
  "id, title, description, thumbnail_url, video_url, status, format, duration_sec, hashtags, credits_used, created_at, updated_at";

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
export async function getLatestJob(videoId: string): Promise<GenerationJobState | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generation_jobs")
    .select("status, last_error, video_id")
    .eq("video_id", videoId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    status: data.status as GenerationJobStatus,
    lastError: data.last_error ?? null,
    videoId: data.video_id,
  };
}
