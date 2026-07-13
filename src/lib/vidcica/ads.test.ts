import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { adsErrorMessage, createAdCampaign, resolveAdAccount, setCampaignStatus } from "./ads";

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
});

describe("createAdCampaign (AC-3/4)", () => {
  it("returns in_review + external id on success", async () => {
    const out = await createAdCampaign(
      db(true, ok({ ok: true, status: "in_review", external_campaign_id: "123" })),
      "camp-1",
    );
    expect(out).toEqual({ ok: true, status: "in_review", externalCampaignId: "123" });
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

describe("adsErrorMessage", () => {
  it("maps known reasons to distinct French copy and falls back", () => {
    expect(adsErrorMessage("monthly_cap_exceeded")).toMatch(/plafond/i);
    expect(adsErrorMessage("needs_reconnect")).toMatch(/facebook/i);
    expect(adsErrorMessage("no_video_url")).toMatch(/vidéo/i);
    expect(adsErrorMessage("objective_unsupported_phase1")).toMatch(/objectif/i);
    expect(adsErrorMessage("below_min_budget")).toMatch(/budget/i);
    // distinct reasons must not collapse into the generic fallback
    const generic = adsErrorMessage("weird");
    expect(adsErrorMessage("no_video_url")).not.toBe(generic);
    expect(adsErrorMessage("objective_unsupported_phase1")).not.toBe(generic);
    expect(generic).toMatch(/erreur/i);
  });
});
