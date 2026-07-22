"use server";

import { createClient } from "@/lib/supabase/server";
import { entityId as VideoId } from "@/lib/vidcica/id";
import type { Database } from "@/lib/supabase/database.types";

type VideoInsert = Database["public"]["Tables"]["videos"]["Insert"];
type ActionResult = { ok: true } | { ok: false; message: string };
type DuplicateResult = { ok: true; id: string } | { ok: false; message: string };

/**
 * Soft-delete the caller's own video (moves it to the trash — the mobile app's
 * `remove()` sets `deleted_at`; a 30-day purge cron finalises it). RLS scopes the
 * update to `user_id = auth.uid()`; `.select` distinguishes a real delete from a
 * zero-row match (stale / someone else's id) so we never report a false success.
 */
export async function deleteVideo(id: string): Promise<ActionResult> {
  const parsed = VideoId.safeParse(id);
  if (!parsed.success) return { ok: false, message: "Identifiant invalide" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  const { data, error } = await supabase
    .from("videos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .is("deleted_at", null)
    .select("id");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0) return { ok: false, message: "Vidéo introuvable" };
  return { ok: true };
}

/**
 * Restore the caller's own soft-deleted video (clears `deleted_at`, moving it
 * back to the library — mirrors the mobile trash's «Restaurer»). RLS scopes the
 * update to `user_id = auth.uid()`; the `.is("deleted_at", null)` inverse guard
 * plus `.select` distinguishes a real restore from a zero-row match (already
 * restored / purged / not the caller's) so we never report a false success.
 */
export async function restoreVideo(id: string): Promise<ActionResult> {
  const parsed = VideoId.safeParse(id);
  if (!parsed.success) return { ok: false, message: "Identifiant invalide" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  const { data, error } = await supabase
    .from("videos")
    .update({ deleted_at: null })
    .eq("id", parsed.data)
    .not("deleted_at", "is", null)
    .select("id");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0) return { ok: false, message: "Vidéo introuvable" };
  return { ok: true };
}

// The copyable columns: everything that defines the video's content, minus the
// lifecycle/metrics fields (status, publish dates, views…) which reset on a copy.
const SOURCE_COLUMNS =
  "title, description, format, duration_sec, hashtags, script, tone, style, voice, music_mood, subtitle_style, template_id, thumbnail_url, segments, workspace_id";

/**
 * Duplicate the caller's own video as a fresh draft (mobile `duplicate()`):
 * copies the content fields, mints a new id, resets status to `brouillon`, and
 * drops the rendered media / schedule / metrics. The initial read is RLS-scoped,
 * so a non-owned / missing id yields no source and we abort.
 */
export async function duplicateVideo(id: string): Promise<DuplicateResult> {
  const parsed = VideoId.safeParse(id);
  if (!parsed.success) return { ok: false, message: "Identifiant invalide" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  const { data: src, error: readErr } = await supabase
    .from("videos")
    .select(SOURCE_COLUMNS)
    .eq("id", parsed.data)
    .is("deleted_at", null)
    .maybeSingle();
  if (readErr) return { ok: false, message: readErr.message };
  if (!src) return { ok: false, message: "Vidéo introuvable" };

  const copy: VideoInsert = {
    id: crypto.randomUUID(),
    user_id: user.id,
    title: `${src.title} (copie)`,
    description: src.description,
    format: src.format,
    duration_sec: src.duration_sec,
    hashtags: src.hashtags,
    script: src.script,
    tone: src.tone,
    style: src.style,
    voice: src.voice,
    music_mood: src.music_mood,
    subtitle_style: src.subtitle_style,
    template_id: src.template_id,
    thumbnail_url: src.thumbnail_url,
    segments: src.segments,
    workspace_id: src.workspace_id,
    status: "brouillon",
    // Fresh draft: no rendered file, no schedule, no publish history/metrics.
    video_url: null,
    published_at: null,
    scheduled_at: null,
    networks: [],
  };

  const { data: inserted, error: insErr } = await supabase
    .from("videos")
    .insert(copy)
    .select("id")
    .single();
  if (insErr || !inserted) return { ok: false, message: insErr?.message ?? "Échec de la copie" };
  return { ok: true, id: inserted.id };
}
