import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  adsErrorKey,
  adsErrorText,
  createAdCampaign,
  resolveAdAccount,
  setCampaignStatus,
} from "./ads";
import { translate } from "@/lib/i18n";

type DB = SupabaseClient<Database>;
type InvokeResult = { data: unknown; error: unknown };

/** Fake client: a session (unless signed out) + a stubbed functions.invoke. */
function db(signedIn: boolean, invoke?: () => Promise<InvokeResult>): DB {
  return {
    auth: {
      getSession: async () => ({ data: { session: signedIn ? { access_token: "t" } : null } }),
    },
    functions: { invoke: invoke ?? (async () => ({ data: {}, error: null })) },
  } as unknown as DB;
}

/** A 2xx invoke: data set, no error (what functions.invoke returns on success). */
const ok = (body: unknown) => async (): Promise<InvokeResult> => ({ data: body, error: null });

/** A non-2xx invoke: FunctionsHttpError whose `context` is the raw Response. */
const httpError = (status: number, body: unknown) => async (): Promise<InvokeResult> => ({
  data: null,
  error: { name: "FunctionsHttpError", context: { status, json: async () => body } },
});

describe("resolveAdAccount (AC-2 gate)", () => {
  it("returns unauthenticated with no session (no invoke)", async () => {
    const out = await resolveAdAccount(db(false));
    expect(out).toEqual({ ok: false, reason: "unauthenticated" });
  });

  it("maps a 503 to ads_not_configured", async () => {
    const out = await resolveAdAccount(db(true, httpError(503, {})));
    expect(out).toEqual({ ok: false, reason: "ads_not_configured" });
  });

  it("returns the account + page when present", async () => {
    const out = await resolveAdAccount(
      db(
        true,
        ok({ ok: true, hasAccount: true, hasPage: true, adAccountId: "act_1", pageName: "P" }),
      ),
    );
    expect(out).toMatchObject({ ok: true, hasAccount: true, hasPage: true, adAccountId: "act_1" });
  });

  it("carries the account’s live minimum and cap, in its currency", async () => {
    const out = await resolveAdAccount(
      db(
        true,
        ok({
          ok: true,
          hasAccount: true,
          hasPage: true,
          currency: "CAD",
          minDailyBudget: 5,
          monthlyCap: 500,
        }),
      ),
    );
    expect(out).toMatchObject({ ok: true, currency: "CAD", minDailyBudget: 5, monthlyCap: 500 });
  });

  it("an older answer without the minimum still parses (falls back later)", async () => {
    const out = await resolveAdAccount(
      db(true, ok({ ok: true, hasAccount: true, hasPage: true, minDailyBudget: "x" })),
    );
    expect(out).toMatchObject({ ok: true, hasAccount: true });
    expect(out.ok && out.minDailyBudget).toBeFalsy();
  });
});

describe("createAdCampaign (AC-3/4)", () => {
  it("returns in_review + external id on success", async () => {
    const out = await createAdCampaign(
      db(true, ok({ ok: true, status: "in_review", external_campaign_id: "123" })),
      "camp-1",
    );
    expect(out).toEqual({ ok: true, status: "in_review", externalCampaignId: "123" });
  });

  it("a campaign launched already answers ok with its current status", async () => {
    const out = await createAdCampaign(
      db(true, ok({ ok: true, status: "en_pause", already: true })),
      "camp-1",
    );
    expect(out).toMatchObject({ ok: true, status: "en_pause", already: true });
  });

  it("carries the minimum and currency of a below_min_budget refusal", async () => {
    const out = await createAdCampaign(
      db(true, httpError(422, { error: "below_min_budget", minDaily: 3000, currency: "XOF" })),
      "camp-1",
    );
    expect(out).toMatchObject({
      ok: false,
      reason: "below_min_budget",
      minDaily: 3000,
      currency: "XOF",
    });
  });

  it("surfaces a create error reason (stays a draft)", async () => {
    const out = await createAdCampaign(
      db(true, httpError(412, { error: "needs_reconnect" })),
      "camp-1",
    );
    expect(out).toMatchObject({ ok: false, reason: "needs_reconnect" });
  });
});

describe("setCampaignStatus (AC-5/6)", () => {
  it("activates", async () => {
    const out = await setCampaignStatus(
      db(true, ok({ ok: true, status: "active" })),
      "c",
      "activate",
    );
    expect(out).toEqual({ ok: true, status: "active" });
  });

  it("pauses", async () => {
    const out = await setCampaignStatus(
      db(true, ok({ ok: true, status: "en_pause" })),
      "c",
      "pause",
    );
    expect(out).toEqual({ ok: true, status: "en_pause" });
  });

  it("carries the monthly cap on monthly_cap_exceeded", async () => {
    const out = await setCampaignStatus(
      db(true, httpError(422, { error: "monthly_cap_exceeded", cap: 50000, projected: 60000 })),
      "c",
      "activate",
    );
    expect(out).toMatchObject({
      ok: false,
      reason: "monthly_cap_exceeded",
      cap: 50000,
      projected: 60000,
    });
  });

  it("carries the min daily budget on below_min_budget", async () => {
    const out = await setCampaignStatus(
      db(true, httpError(422, { error: "below_min_budget", minDaily: 500 })),
      "c",
      "activate",
    );
    expect(out).toMatchObject({ ok: false, reason: "below_min_budget", minDaily: 500 });
  });
});

describe("adsErrorKey", () => {
  it("maps known reasons to distinct keys and falls back", () => {
    expect(adsErrorKey("monthly_cap_exceeded")).toBe("ads.err.monthlyCap");
    expect(adsErrorKey("needs_reconnect")).toBe("ads.err.needsReconnect");
    expect(adsErrorKey("no_video_url")).toBe("ads.err.noVideoUrl");
    expect(adsErrorKey("objective_unsupported_phase1")).toBe("ads.err.objectiveUnsupported");
    expect(adsErrorKey("below_min_budget")).toBe("ads.err.belowMinBudget");
    expect(adsErrorKey("missing_url")).toBe("ads.err.missingUrl");
    expect(adsErrorKey("country_unavailable")).toBe("ads.err.countryUnavailable");
    expect(adsErrorKey("meta_error")).toBe("ads.err.metaRefused");
    expect(adsErrorKey("weird")).toBe("ads.err.generic");
  });

  it("maps the reasons the 2026-10-18 functions added", () => {
    expect(adsErrorKey("plan_required")).toBe("ads.err.planRequired");
    expect(adsErrorKey("pause_in_ads_manager")).toBe("ads.err.pauseInAdsManager");
    expect(adsErrorKey("currency_changed")).toBe("ads.err.currencyChanged");
    expect(adsErrorKey("launch_in_progress")).toBe("ads.err.launchInProgress");
    expect(adsErrorKey("ad_account_disabled")).toBe("ads.err.adAccountDisabled");
    expect(adsErrorKey("no_ads_scope")).toBe("ads.err.noAdsScope");
    expect(adsErrorKey("token_decrypt_failed")).toBe("ads.err.tokenDecrypt");
    expect(adsErrorKey("meta_unreachable")).toBe("ads.err.metaUnreachable");
  });

  it("says the amount when the server named one, in the account’s currency", () => {
    const t = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) =>
      translate("fr", key, vars);
    expect(adsErrorText(t, { reason: "below_min_budget", minDaily: 5, currency: "CAD" })).toBe(
      "Le budget quotidien minimum de votre compte publicitaire est de 5 $CA.",
    );
    expect(
      adsErrorText(t, {
        reason: "monthly_cap_exceeded",
        cap: 500,
        projected: 600,
        currency: "EUR",
      }),
    ).toContain("500 €");
    // Without amounts, the plain message.
    expect(adsErrorText(t, { reason: "below_min_budget" })).toBe(
      "Le budget quotidien est en dessous du minimum autorisé.",
    );
  });

  // The bug this replaced: a French sentence on an English page.
  it("reads in the page's language", () => {
    const reasons = ["monthly_cap_exceeded", "needs_reconnect", "missing_url", "weird"];
    for (const reason of reasons) {
      const key = adsErrorKey(reason);
      expect(translate("en", key)).not.toBe(translate("fr", key));
    }
    expect(translate("en", adsErrorKey("weird"))).toBe("Something went wrong. Try again.");
    expect(translate("fr", adsErrorKey("weird"))).toBe("Une erreur est survenue. Réessayez.");
  });
});
