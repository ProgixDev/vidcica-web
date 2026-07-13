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
import type { Database } from "@/lib/supabase/database.types";

type DB = SupabaseClient<Database>;

/**
 * Invoke an existing edge function via the Supabase client (`functions.invoke`) —
 * the client injects the base URL + the caller's auth; we never re-implement the
 * function. Request bodies mirror ClipFlow/src/lib/ads-launch.ts exactly.
 *
 * A non-2xx response (incl. the 503 `ads_not_configured` gate) comes back as a
 * `FunctionsHttpError` whose `context` is the raw Response, so we can still read
 * the status + structured error codes the functions return (`cap`, `minDaily`, …)
 * that drive the honest fallback + recovery UX.
 */
async function call(
  db: DB,
  fn: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data: sess } = await db.auth.getSession();
  if (!sess.session) return { ok: false, reason: "unauthenticated" };

  const { data, error } = await db.functions.invoke(fn, { body });
  if (!error) return (data ?? {}) as Record<string, unknown>;

  const ctx = (error as { context?: { status?: number; json?: () => Promise<unknown> } }).context;
  if (ctx && typeof ctx.status === "number") {
    if (ctx.status === 503) return { ok: false, reason: "ads_not_configured" };
    const raw = ctx.json ? await ctx.json().catch(() => ({})) : {};
    const payload = z.record(z.string(), z.unknown()).safeParse(raw).data ?? {};
    return { ok: false, reason: String(payload.error ?? `http_${ctx.status}`), ...payload };
  }
  return { ok: false, reason: (error as Error).message ?? "error" };
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
