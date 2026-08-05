/**
 * TikTok posting domain — the creator context and the per-post options that
 * TikTok's Content Posting API audit REQUIRES us to collect in the UI.
 *
 * Background: an app may not post to TikTok on a creator's behalf unless, before
 * every post, it shows the creator's real username + avatar, lets them pick a
 * privacy level from the ones their account allows, lets them control
 * comment/duet/stitch (without being able to enable what their account has
 * disabled), and lets them declare commercial content. The account-side facts
 * come from the `creator-info` edge function; the choices live in the publish
 * store and travel to `enqueue-publish` as `options.tiktok`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { clientEnv } from "@/core/env.client";
import type { Database } from "@/lib/supabase/database.types";

type DB = SupabaseClient<Database>;

const SUPABASE_URL = clientEnv.NEXT_PUBLIC_SUPABASE_URL;
const CREATOR_INFO_TIMEOUT_MS = 15_000;

/** TikTok's four documented privacy levels. */
export const TIKTOK_PRIVACY_LEVELS = [
  "PUBLIC_TO_EVERYONE",
  "MUTUAL_FOLLOW_FRIENDS",
  "FOLLOWER_OF_CREATOR",
  "SELF_ONLY",
] as const;

export type TikTokPrivacyLevel = (typeof TIKTOK_PRIVACY_LEVELS)[number];

export function isTikTokPrivacyLevel(v: string): v is TikTokPrivacyLevel {
  return (TIKTOK_PRIVACY_LEVELS as ReadonlyArray<string>).includes(v);
}

/** The account-side facts (from `creator-info`), never editable by the user. */
export type TikTokCreatorInfo = {
  username: string;
  avatarUrl: string | null;
  nickname: string | null;
  privacyOptions: TikTokPrivacyLevel[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  maxVideoPostDurationSec: number | null;
};

/** The creator's per-post choices. Mirrors the whitelist in `enqueue-publish`. */
export type TikTokPostOptions = {
  privacyLevel: TikTokPrivacyLevel | null;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
  /** “Contenu de marque” — a paid partnership. Cannot be private. */
  brandContentToggle: boolean;
  /** “Votre marque” — promoting the creator’s own brand. */
  brandOrganicToggle: boolean;
};

/** No privacy pre-selected: TikTok requires an explicit creator choice, so the
 *  composer refuses to submit until one is picked rather than defaulting one. */
export const DEFAULT_TIKTOK_OPTIONS: TikTokPostOptions = {
  privacyLevel: null,
  disableComment: false,
  disableDuet: false,
  disableStitch: false,
  brandContentToggle: false,
  brandOrganicToggle: false,
};

/** Wire shape for `enqueue-publish` (snake_case, as the edge function expects). */
export function toWireOptions(o: TikTokPostOptions): Record<string, unknown> {
  return {
    ...(o.privacyLevel ? { privacy_level: o.privacyLevel } : {}),
    disable_comment: o.disableComment,
    disable_duet: o.disableDuet,
    disable_stitch: o.disableStitch,
    brand_content_toggle: o.brandContentToggle,
    brand_organic_toggle: o.brandOrganicToggle,
  };
}

/**
 * Why a post can't go out yet, or null when it can. Pure so the composer and its
 * tests agree on the rules:
 *  - a privacy level must be explicitly chosen;
 *  - branded content may not be private (TikTok rejects the combination);
 *  - the video must fit the account's max duration.
 */
export type TikTokBlockReason = "privacy_required" | "branded_content_private" | "too_long";

export function tikTokBlockReason(
  o: TikTokPostOptions,
  creator: TikTokCreatorInfo | null,
  videoDurationSec: number,
): TikTokBlockReason | null {
  if (!o.privacyLevel) return "privacy_required";
  if (o.brandContentToggle && o.privacyLevel === "SELF_ONLY") return "branded_content_private";
  if (
    creator?.maxVideoPostDurationSec != null &&
    videoDurationSec > creator.maxVideoPostDurationSec
  ) {
    return "too_long";
  }
  return null;
}

export type CreatorInfoOutcome =
  | { ok: true; creator: TikTokCreatorInfo }
  | { ok: false; reason: "needs_reconnect" | "not_connected" | "error"; message?: string };

/** Fetch the creator's posting context. Called when TikTok is selected in the
 *  composer — TikTok requires the query to precede the post, not the session. */
export async function fetchTikTokCreatorInfo(
  supabase: DB,
  signal?: AbortSignal,
): Promise<CreatorInfoOutcome> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) return { ok: false, reason: "error", message: "unauthenticated" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CREATOR_INFO_TIMEOUT_MS);
  signal?.addEventListener("abort", () => controller.abort(), { once: true });
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/creator-info`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "tiktok" }),
      signal: controller.signal,
    });
    const body = (await res.json().catch(() => ({}))) as {
      creator?: TikTokCreatorInfo;
      error?: string;
    };
    if (res.status === 409 && body.error === "needs_reconnect") {
      return { ok: false, reason: "needs_reconnect" };
    }
    if (res.status === 409) return { ok: false, reason: "not_connected" };
    if (!res.ok || !body.creator) {
      return { ok: false, reason: "error", message: body.error ?? `HTTP ${res.status}` };
    }
    // Keep only privacy levels we know how to render; an unknown value from the
    // API would otherwise become an unlabelled radio option.
    const creator: TikTokCreatorInfo = {
      ...body.creator,
      privacyOptions: (body.creator.privacyOptions ?? []).filter(isTikTokPrivacyLevel),
    };
    return { ok: true, creator };
  } catch (e) {
    return { ok: false, reason: "error", message: (e as Error).message };
  } finally {
    clearTimeout(timer);
  }
}
