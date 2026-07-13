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
