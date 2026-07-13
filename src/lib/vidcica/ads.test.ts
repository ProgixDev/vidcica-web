import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { adsErrorMessage, createAdCampaign, resolveAdAccount, setCampaignStatus } from "./ads";

type DB = SupabaseClient<Database>;

/** Fake client whose session yields `token` (null → signed out). */
function db(token: string | null): DB {
  return {
    auth: {
      getSession: async () => ({ data: { session: token ? { access_token: token } : null } }),
    },
  } as unknown as DB;
}

/** Stub one fetch response. */
function stubFetch(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ status, ok: status >= 200 && status < 300, json: async () => body })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("resolveAdAccount (AC-2 gate)", () => {
  it("returns unauthenticated with no session (no fetch)", async () => {
    const out = await resolveAdAccount(db(null));
    expect(out).toEqual({ ok: false, reason: "unauthenticated" });
  });

  it("maps 503 to ads_not_configured", async () => {
    stubFetch(503, {});
    const out = await resolveAdAccount(db("t"));
    expect(out).toEqual({ ok: false, reason: "ads_not_configured" });
  });

  it("returns the account + page when present", async () => {
    stubFetch(200, {
      ok: true,
      hasAccount: true,
      hasPage: true,
      adAccountId: "act_1",
      pageName: "P",
    });
    const out = await resolveAdAccount(db("t"));
    expect(out).toMatchObject({ ok: true, hasAccount: true, hasPage: true, adAccountId: "act_1" });
  });
});

describe("createAdCampaign (AC-3/4)", () => {
  it("returns in_review + external id on success", async () => {
    stubFetch(200, { ok: true, status: "in_review", external_campaign_id: "123" });
    const out = await createAdCampaign(db("t"), "camp-1");
    expect(out).toEqual({ ok: true, status: "in_review", externalCampaignId: "123" });
  });

  it("surfaces a create error reason + message (stays a draft)", async () => {
    stubFetch(412, { error: "needs_reconnect" });
    const out = await createAdCampaign(db("t"), "camp-1");
    expect(out).toEqual({ ok: false, reason: "needs_reconnect", message: undefined });
  });
});

describe("setCampaignStatus (AC-5/6)", () => {
  it("activates", async () => {
    stubFetch(200, { ok: true, status: "active" });
    expect(await setCampaignStatus(db("t"), "c", "activate")).toEqual({
      ok: true,
      status: "active",
    });
  });

  it("pauses", async () => {
    stubFetch(200, { ok: true, status: "en_pause" });
    expect(await setCampaignStatus(db("t"), "c", "pause")).toEqual({
      ok: true,
      status: "en_pause",
    });
  });

  it("carries the monthly cap on monthly_cap_exceeded", async () => {
    stubFetch(422, { error: "monthly_cap_exceeded", cap: 50000, projected: 60000 });
    const out = await setCampaignStatus(db("t"), "c", "activate");
    expect(out).toMatchObject({
      ok: false,
      reason: "monthly_cap_exceeded",
      cap: 50000,
      projected: 60000,
    });
  });

  it("carries the min daily budget on below_min_budget", async () => {
    stubFetch(422, { error: "below_min_budget", minDaily: 500 });
    const out = await setCampaignStatus(db("t"), "c", "activate");
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
