/**
 * Web client for the publish pipeline — port of ClipFlow/src/lib/publishing.ts.
 * Calls the existing `enqueue-publish` edge function; never re-implements it.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { clientEnv } from "@/core/env.client";
import type { Database } from "@/lib/supabase/database.types";
import type { PlatformId } from "@/lib/vidcica/network";

type DB = SupabaseClient<Database>;

const SUPABASE_URL = clientEnv.NEXT_PUBLIC_SUPABASE_URL;
const ENQUEUE_TIMEOUT_MS = 20_000;

export type PublishFailureReason =
  | "auth_expired"
  | "encoding"
  | "rate_limited"
  | "rejected"
  | "unknown";

/** Map the publish-job worker's `last_error` onto an actionable reason (drives
 *  the per-platform recovery CTA). Kept in sync with the SQL CASE in the mobile
 *  reconciler. */
export function mapPublishFailureReason(
  lastError: string | null | undefined,
): PublishFailureReason {
  const e = (lastError ?? "").toLowerCase();
  if (/network_not_connected|decrypt|token|auth|connect/.test(e)) return "auth_expired";
  if (/not_ready|video_url|fetch|encod|upload_failed/.test(e)) return "encoding";
  if (/rate|quota|limit/.test(e)) return "rate_limited";
  if (/reject|refus|not_implemented|forbidden/.test(e)) return "rejected";
  return "unknown";
}

export type EnqueuePublishInput = {
  videoId: string;
  platforms: ReadonlyArray<PlatformId>;
  /** ISO date string; omit for "publish now". */
  scheduledFor?: string;
  /** YouTube only — publish as a Short (default true). */
  asShort?: boolean;
  /**
   * Optional per-platform caption override, keyed by `PlatformId`. When set for a
   * platform the backend uses it verbatim as that platform's post body instead of
   * deriving one from the video's title/description/hashtags.
   */
  captions?: Partial<Record<PlatformId, string>>;
  /**
   * Optional per-platform posting options, keyed by `PlatformId` and already in
   * the backend's snake_case wire shape (see `toWireOptions` in ./tiktok). Only
   * TikTok uses this today — its audit requires the creator to choose privacy,
   * interaction and commercial-disclosure settings for every post.
   */
  options?: Partial<Record<PlatformId, Record<string, unknown>>>;
};

export type EnqueuedJob = { id: string; platform: PlatformId };

export type EnqueueOutcome =
  | { ok: true; jobs: ReadonlyArray<EnqueuedJob>; skipped: ReadonlyArray<PlatformId> }
  | { ok: false; message: string };

export async function enqueuePublish(
  supabase: DB,
  input: EnqueuePublishInput,
): Promise<EnqueueOutcome> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) return { ok: false, message: "Session expirée. Reconnectez-vous." };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ENQUEUE_TIMEOUT_MS);
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/enqueue-publish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId: input.videoId,
        platforms: input.platforms,
        scheduledFor: input.scheduledFor,
        asShort: input.asShort,
        captions: input.captions,
        options: input.options,
      }),
      signal: controller.signal,
    });
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      jobs?: ReadonlyArray<EnqueuedJob>;
      skipped?: ReadonlyArray<PlatformId>;
      error?: string;
      message?: string;
    };
    if (!res.ok || !body.ok) {
      return { ok: false, message: body.message ?? body.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, jobs: body.jobs ?? [], skipped: body.skipped ?? [] };
  } catch (e) {
    const message =
      (e as Error).name === "AbortError" ? "Délai dépassé. Réessayez." : (e as Error).message;
    return { ok: false, message };
  } finally {
    clearTimeout(timer);
  }
}

// -- Unpublish (delete the live post) ----------------------------------------

/**
 * Platforms whose live post `delete-post` can actually remove.
 *
 * The edge function answers honestly for the rest: Instagram media is NOT
 * deletable through the Graph API (`not_deletable`), and TikTok / LinkedIn /
 * Threads return `unsupported_platform`. The UI must therefore only offer
 * "Retirer" for these two rather than imply a success it cannot deliver.
 */
export const UNPUBLISHABLE_PLATFORMS: readonly PlatformId[] = ["youtube", "facebook"];

export function canUnpublish(platform: PlatformId): boolean {
  return UNPUBLISHABLE_PLATFORMS.includes(platform);
}

export type UnpublishFailReason =
  | "unauthenticated"
  | "not_deletable"
  | "unsupported_platform"
  | "reconnect_required"
  | "delete_failed"
  | "error";

export type UnpublishOutcome =
  | { ok: true }
  | { ok: false; reason: UnpublishFailReason; message?: string };

/**
 * Delete a published post from the platform AND un-publish it in the app.
 *
 * This is the immediate counterpart to the hourly liveness cron. That cron
 * eventually notices a post deleted on the platform and sets `post_deleted_at`
 * / drains `videos.networks` — but until it runs, `enqueue-publish` still treats
 * the platform as live and silently refuses to republish. Removing from inside
 * the app closes that up-to-an-hour window immediately.
 */
export async function deletePublishedPost(
  supabase: DB,
  videoId: string,
  platform: PlatformId,
): Promise<UnpublishOutcome> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) return { ok: false, reason: "unauthenticated" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ENQUEUE_TIMEOUT_MS);
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-post`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, platform }),
      signal: controller.signal,
    });
    // delete-post answers HTTP 200 with { ok:false, error } for EXPECTED
    // refusals (not_deletable, reconnect_required...), so read the body before
    // trusting the status code.
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      message?: string;
    };
    if (res.ok && body.ok) return { ok: true };
    return {
      ok: false,
      reason: mapUnpublishReason(body.error),
      message: body.message ?? body.error ?? `HTTP ${res.status}`,
    };
  } catch (e) {
    const message =
      (e as Error).name === "AbortError" ? "Delai depasse. Reessayez." : (e as Error).message;
    return { ok: false, reason: "error", message };
  } finally {
    clearTimeout(timer);
  }
}

/** Map delete-post's error string -> a caller-actionable reason. */
export function mapUnpublishReason(error: string | undefined): UnpublishFailReason {
  switch (error) {
    case "not_deletable":
      return "not_deletable";
    case "unsupported_platform":
      return "unsupported_platform";
    case "reconnect_required":
    case "google_oauth_not_configured":
      return "reconnect_required";
    case "delete_failed":
    case "lookup_failed":
      return "delete_failed";
    default:
      return "error";
  }
}

/**
 * Public URL of a published post, or null when one cannot be derived.
 *
 * Only three platforms store an id a URL can be built from:
 *   youtube   video id            -> /watch?v=<id>
 *   linkedin  urn:li:ugcPost:<n>  -> /feed/update/<urn>/
 *   facebook  post id             -> /<id>
 *
 * The rest deliberately return null rather than a plausible-looking broken
 * link. TikTok stores a PUBLISH id ("v_pub_file~v2-1.765...") which is not the
 * video id, and Instagram/Threads store a media id, not the shortcode their
 * public URLs use. There is no way to turn either into a working link without
 * an extra API round-trip.
 */
export function publicPostUrl(platform: PlatformId, externalPostId: string | null): string | null {
  if (!externalPostId) return null;
  switch (platform) {
    case "youtube":
      return `https://www.youtube.com/watch?v=${encodeURIComponent(externalPostId)}`;
    case "linkedin":
      return `https://www.linkedin.com/feed/update/${encodeURIComponent(externalPostId)}/`;
    case "facebook":
      return `https://www.facebook.com/${encodeURIComponent(externalPostId)}`;
    default:
      return null;
  }
}
