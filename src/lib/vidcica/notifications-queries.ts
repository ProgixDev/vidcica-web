import "server-only";
import { createClient } from "@/lib/supabase/server";
import { rowToNotification, type AppNotification } from "@/lib/vidcica/notification";

const NOTIFICATION_COLUMNS =
  "id, type, category, title, body, created_at, read, video_id, campaign_id, lead_id";

/** The signed-in user's notifications, newest first (RLS read-own). */
export async function listMyNotifications(limit = 50): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((r) => rowToNotification(r as Parameters<typeof rowToNotification>[0]));
}
