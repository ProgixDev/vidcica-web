/**
 * Server-side, RLS-scoped reads for the video TRASH (soft-deleted rows). Kept in
 * a dedicated module (not `queries.ts`) because the trash view needs the
 * `deleted_at` column that the main workspace mapper deliberately drops. RLS
 * (`user_id = auth.uid()`) scopes every row to the caller — no explicit filter.
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";

/** A soft-deleted video, as the trash list renders it. */
export type TrashedVideo = {
  id: string;
  title: string;
  /** ISO timestamp the video was moved to the trash. */
  deletedAt: string;
};

/**
 * The caller's soft-deleted videos (`deleted_at` set), most-recently-trashed
 * first. A 30-day purge cron finalises them; until then they can be restored.
 */
export async function listMyTrashedVideos(): Promise<TrashedVideo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("videos")
    .select("id, title, deleted_at")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error || !data) return [];
  return data
    .filter((r): r is { id: string; title: string; deleted_at: string } => r.deleted_at != null)
    .map((r) => ({ id: r.id, title: r.title, deletedAt: r.deleted_at }));
}
