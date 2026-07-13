/**
 * Notification domain — shared (centre + bell). Ported from ClipFlow entities +
 * db-mappers `rowToNotification`. Rows are minted server-side; the web reads +
 * write-throughs only the read state.
 */
import type { Database } from "@/lib/supabase/database.types";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

/** Severity — drives the indicator colour. */
export type NotificationType = "success" | "warning" | "info";

/** Kind of event. */
export type NotificationCategory =
  | "video_ready"
  | "publish_success"
  | "new_lead"
  | "ads_alert"
  | "payment";

export type AppNotification = {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  videoId?: string;
  campaignId?: string;
  leadId?: string;
};

const TYPES: ReadonlyArray<NotificationType> = ["success", "warning", "info"];

export function rowToNotification(r: NotificationRow): AppNotification {
  return {
    id: r.id,
    type: (TYPES as readonly string[]).includes(r.type) ? (r.type as NotificationType) : "info",
    category: r.category as NotificationCategory,
    title: r.title,
    body: r.body,
    createdAt: r.created_at,
    read: r.read,
    videoId: r.video_id ?? undefined,
    campaignId: r.campaign_id ?? undefined,
    leadId: r.lead_id ?? undefined,
  };
}

export const unreadCount = (items: ReadonlyArray<AppNotification>): number =>
  items.reduce((n, x) => (x.read ? n : n + 1), 0);

/** The in-app destination for a notification, or null when there's nothing to open. */
export function notificationHref(n: AppNotification): string | null {
  if ((n.category === "video_ready" || n.category === "publish_success") && n.videoId) {
    return `/videos/${n.videoId}`;
  }
  return null; // leads / ads / payment destinations aren't built on web yet
}

export const TYPE_VARIANT: Record<NotificationType, "success" | "warning" | "brand"> = {
  success: "success",
  warning: "warning",
  info: "brand",
};

export const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  video_ready: "Vidéo prête",
  publish_success: "Publication",
  new_lead: "Nouveau lead",
  ads_alert: "Publicités",
  payment: "Paiement",
};

/** Compact FR relative time (no date-fns dep). `now` is injectable for tests. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const diffMs = new Date(iso).getTime() - now;
  const abs = Math.abs(diffMs);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  if (abs < min) return "à l’instant";
  if (abs < hour) return rtf.format(Math.round(diffMs / min), "minute");
  if (abs < day) return rtf.format(Math.round(diffMs / hour), "hour");
  return rtf.format(Math.round(diffMs / day), "day");
}
