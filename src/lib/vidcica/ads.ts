/**
 * Web client for the Meta Ads edge functions. Mirrors ClipFlow/src/lib/ads-launch.ts.
 * Three live functions back the "boost your video" flow — no new backend:
 *   resolve-ad-account  → gate: is a real ad account + Page available?
 *   create-ad-campaign  → build the real, PAUSED Meta campaign from a campaigns row
 *   set-campaign-status → explicit activate/pause (server spend-cap guarded)
 *
 * A 503 `ads_not_configured` (until META secrets are set) keeps the app on the
 * honest draft path. Responses are zod-parsed, never trusted via cast.
 */
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clientEnv } from "@/core/env.client";
import type { Database } from "@/lib/supabase/database.types";

type DB = SupabaseClient<Database>;
const SUPABASE_URL = clientEnv.NEXT_PUBLIC_SUPABASE_URL;

/** POST an edge function with the caller's session bearer; normalize failures. */
async function call(db: DB, fn: string, body: unknown): Promise<Record<string, unknown>> {
  const { data } = await db.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, reason: "unauthenticated" };
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 503) return { ok: false, reason: "ads_not_configured" };
    const parsed = z.record(z.string(), z.unknown()).safeParse(await res.json().catch(() => ({})));
    const json = parsed.success ? parsed.data : {};
    if (!res.ok) return { ok: false, reason: String(json.error ?? `http_${res.status}`), ...json };
    return json;
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

// ── resolve-ad-account ──────────────────────────────────────────────

export type AdAccountOutcome =
  | {
      ok: true;
      hasAccount: boolean;
      hasPage: boolean;
      adAccountId?: string;
      currency?: string;
      pageName?: string;
    }
  | { ok: false; reason: string };

const adAccountSchema = z.object({
  ok: z.literal(true).optional(),
  hasAccount: z.boolean().optional(),
  hasPage: z.boolean().optional(),
  adAccountId: z.string().optional(),
  currency: z.string().optional(),
  pageName: z.string().optional(),
});

/** Capture + return the user's Meta ad account/Page. Gates whether real ads are available. */
export async function resolveAdAccount(db: DB): Promise<AdAccountOutcome> {
  const raw = await call(db, "resolve-ad-account", {});
  if (raw.ok === false) return { ok: false, reason: String(raw.reason ?? "error") };
  const p = adAccountSchema.safeParse(raw);
  if (!p.success) return { ok: false, reason: "bad_response" };
  return {
    ok: true,
    hasAccount: p.data.hasAccount ?? false,
    hasPage: p.data.hasPage ?? false,
    adAccountId: p.data.adAccountId,
    currency: p.data.currency,
    pageName: p.data.pageName,
  };
}

// ── create-ad-campaign ──────────────────────────────────────────────

export type CreateCampaignOutcome =
  | { ok: true; status: "in_review"; externalCampaignId?: string }
  | { ok: false; reason: string; message?: string };

/** Create the real, PAUSED Meta campaign from an existing `campaigns` row id. */
export async function createAdCampaign(db: DB, campaignId: string): Promise<CreateCampaignOutcome> {
  const raw = await call(db, "create-ad-campaign", { campaignId });
  if (raw.ok === true) {
    return {
      ok: true,
      status: "in_review",
      externalCampaignId:
        typeof raw.external_campaign_id === "string" ? raw.external_campaign_id : undefined,
    };
  }
  return {
    ok: false,
    reason: String(raw.reason ?? "error"),
    message: typeof raw.message === "string" ? raw.message : undefined,
  };
}

// ── set-campaign-status ─────────────────────────────────────────────

export type StatusOutcome =
  | { ok: true; status: "active" | "en_pause" }
  | { ok: false; reason: string; cap?: number; minDaily?: number; projected?: number };

/** Activate (spend-cap-guarded) or pause a created campaign. */
export async function setCampaignStatus(
  db: DB,
  campaignId: string,
  action: "activate" | "pause",
): Promise<StatusOutcome> {
  const raw = await call(db, "set-campaign-status", { campaignId, action });
  if (raw.ok === true && (raw.status === "active" || raw.status === "en_pause")) {
    return { ok: true, status: raw.status };
  }
  return {
    ok: false,
    reason: String(raw.reason ?? "error"),
    cap: typeof raw.cap === "number" ? raw.cap : undefined,
    minDaily: typeof raw.minDaily === "number" ? raw.minDaily : undefined,
    projected: typeof raw.projected === "number" ? raw.projected : undefined,
  };
}

/** Map an ads edge-fn `reason` to a French, user-facing message. */
export function adsErrorMessage(reason: string): string {
  switch (reason) {
    case "ads_not_configured":
      return "La publicité n’est pas encore disponible sur votre compte.";
    case "unauthenticated":
      return "Session expirée. Reconnectez-vous.";
    case "needs_reconnect":
      return "Reconnectez votre compte Facebook (autorisations publicité requises).";
    case "no_ad_account":
      return "Aucun compte publicitaire Meta n’est associé à votre compte.";
    case "no_page":
      return "Aucune Page Facebook n’est associée à votre compte.";
    case "no_video_url":
      return "La vidéo n’est pas encore disponible. Réessayez une fois le rendu terminé.";
    case "objective_unsupported_phase1":
      return "Cet objectif n’est pas encore pris en charge.";
    case "campaign_not_created":
      return "Créez d’abord la campagne avant de l’activer.";
    case "below_min_budget":
      return "Le budget quotidien est en dessous du minimum autorisé.";
    case "monthly_cap_exceeded":
      return "Plafond de dépenses mensuel atteint. Mettez une campagne en pause pour continuer.";
    default:
      return "Une erreur est survenue. Réessayez.";
  }
}
