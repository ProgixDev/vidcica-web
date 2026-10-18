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
import type { MessageKey, TFunction } from "@/lib/i18n";
import { formatAdMoney } from "@/lib/vidcica/campaign";

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
      adAccountName?: string;
      currency?: string;
      pageName?: string;
      /** The smallest daily budget, in the account's currency (major units).
       *  Live from resolve-ad-account since 2026-10-18; older answers lack it. */
      minDailyBudget?: number;
      /** Our monthly spend cap, in the account's currency (major units). */
      monthlyCap?: number;
    }
  | { ok: false; reason: string };

const adAccountSchema = z.object({
  ok: z.literal(true).optional(),
  hasAccount: z.boolean().optional(),
  hasPage: z.boolean().optional(),
  adAccountId: z.string().optional(),
  adAccountName: z.string().nullish(),
  currency: z.string().optional(),
  pageName: z.string().optional(),
  minDailyBudget: z.number().positive().optional().catch(undefined),
  monthlyCap: z.number().positive().optional().catch(undefined),
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
    adAccountName: p.data.adAccountName ?? undefined,
    currency: p.data.currency,
    pageName: p.data.pageName,
    minDailyBudget: p.data.minDailyBudget,
    monthlyCap: p.data.monthlyCap,
  };
}

// ── create-ad-campaign ──────────────────────────────────────────────

export type CreateCampaignOutcome =
  | { ok: true; status: string; externalCampaignId?: string; already?: boolean }
  | {
      ok: false;
      reason: string;
      message?: string;
      /** below_min_budget: the minimum, in the account's currency. */
      minDaily?: number;
      currency?: string;
    };

/** Create the real, PAUSED Meta campaign from an existing `campaigns` row id.
 *  A campaign launched already answers `already: true` with its current status. */
export async function createAdCampaign(db: DB, campaignId: string): Promise<CreateCampaignOutcome> {
  const raw = await call(db, "create-ad-campaign", { campaignId });
  if (raw.ok === true) {
    return {
      ok: true,
      status: typeof raw.status === "string" ? raw.status : "in_review",
      already: raw.already === true || undefined,
      externalCampaignId:
        typeof raw.external_campaign_id === "string" ? raw.external_campaign_id : undefined,
    };
  }
  return {
    ok: false,
    reason: String(raw.reason ?? "error"),
    message: typeof raw.message === "string" ? raw.message : undefined,
    minDaily: typeof raw.minDaily === "number" ? raw.minDaily : undefined,
    currency: typeof raw.currency === "string" ? raw.currency : undefined,
  };
}

// ── set-campaign-status ─────────────────────────────────────────────

export type StatusOutcome =
  | { ok: true; status: "active" | "en_pause" }
  | {
      ok: false;
      reason: string;
      cap?: number;
      minDaily?: number;
      projected?: number;
      /** The currency cap/minDaily/projected are in (the ad account's). */
      currency?: string;
      /** pause_in_ads_manager: where to pause it by hand. */
      adsManagerUrl?: string;
    };

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
    currency: typeof raw.currency === "string" ? raw.currency : undefined,
    adsManagerUrl:
      typeof raw.adsManagerUrl === "string" && raw.adsManagerUrl.startsWith("https://")
        ? raw.adsManagerUrl
        : undefined,
  };
}

/** Map an ads edge-fn `reason` to the i18n key of its user-facing message, so it
 *  reads in the page's language (a hardcoded French string showed on English pages). */
export function adsErrorKey(reason: string): MessageKey {
  switch (reason) {
    case "ads_not_configured":
      return "ads.err.notConfigured";
    case "unauthenticated":
      return "ads.err.sessionExpired";
    case "needs_reconnect":
      return "ads.err.needsReconnect";
    case "no_ad_account":
      return "ads.err.noAdAccount";
    case "no_page":
      return "ads.err.noPage";
    case "no_video_url":
      return "ads.err.noVideoUrl";
    case "objective_unsupported_phase1":
      return "ads.err.objectiveUnsupported";
    case "missing_url":
      return "ads.err.missingUrl";
    case "country_unavailable":
      return "ads.err.countryUnavailable";
    case "campaign_not_created":
      return "ads.err.campaignNotCreated";
    case "below_min_budget":
      return "ads.err.belowMinBudget";
    case "monthly_cap_exceeded":
      return "ads.err.monthlyCap";
    case "plan_required":
      return "ads.err.planRequired";
    case "pause_in_ads_manager":
      return "ads.err.pauseInAdsManager";
    case "currency_changed":
      return "ads.err.currencyChanged";
    case "launch_in_progress":
      return "ads.err.launchInProgress";
    case "campaign_ended":
      return "ads.err.campaignEnded";
    case "ad_account_disabled":
      return "ads.err.adAccountDisabled";
    case "no_ads_scope":
      return "ads.err.noAdsScope";
    case "token_decrypt_failed":
      return "ads.err.tokenDecrypt";
    case "meta_unreachable":
    case "meta_rate_limited":
      return "ads.err.metaUnreachable";
    case "meta_error":
    case "meta_permission":
      return "ads.err.metaRefused";
    default:
      return "ads.err.generic";
  }
}

/**
 * The full message for an ads failure, amounts included when the server sent
 * them (a minimum or a cap, in the AD ACCOUNT's currency). Falls back to the
 * plain message of `adsErrorKey`.
 */
export function adsErrorText(
  t: TFunction,
  out: { reason: string; minDaily?: number; cap?: number; projected?: number; currency?: string },
  locale = "fr-FR",
): string {
  const money = (n: number) => formatAdMoney(n, out.currency, locale);
  if (out.reason === "below_min_budget" && out.minDaily && out.currency) {
    return t("ads.err.belowMinBudgetAmount", { amount: money(out.minDaily) });
  }
  if (out.reason === "monthly_cap_exceeded" && out.cap && out.currency) {
    return t("ads.err.monthlyCapAmount", {
      cap: money(out.cap),
      projected: money(out.projected ?? out.cap),
    });
  }
  return t(adsErrorKey(out.reason));
}
