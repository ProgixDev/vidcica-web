import { describe, expect, it } from "vitest";
import {
  boostDraftToRow,
  isLaunched,
  rowToCampaign,
  SUPPORTED_OBJECTIVES,
  type BoostDraft,
  type CampaignRow,
} from "./campaign";

const row = (over: Partial<CampaignRow> = {}): CampaignRow =>
  ({
    id: "c1",
    name: "Ma campagne",
    objective: "trafic",
    status: "active",
    budget_mode: "quotidien",
    budget_daily: 25,
    budget_total: 0,
    budget_spent: 12.5,
    reach: 1000,
    impressions: 3000,
    clicks: 90,
    conversions: 4,
    leads: 2,
    cpm: 5,
    ctr: 3,
    cpc: 0.4,
    start_date: "2026-07-01T00:00:00Z",
    end_date: null,
    video_id: "v1",
    countries: ["FR", "BE"],
    gender: "tous",
    age_min: 18,
    age_max: 45,
    external_campaign_id: "ext1",
    last_error: null,
    metrics_updated_at: "2026-07-13T00:00:00Z",
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-12T00:00:00Z",
    ...over,
  }) as CampaignRow;

describe("rowToCampaign (AC-7 metrics)", () => {
  it("maps metrics from the row", () => {
    const c = rowToCampaign(row());
    expect(c.metrics).toMatchObject({
      budgetSpent: 12.5,
      reach: 1000,
      impressions: 3000,
      clicks: 90,
      conversions: 4,
      leads: 2,
      updatedAt: "2026-07-13T00:00:00Z",
    });
    expect(c.externalCampaignId).toBe("ext1");
    expect(c.countries).toEqual(["FR", "BE"]);
  });

  it("coerces null metric columns to honest zeros", () => {
    const c = rowToCampaign(
      row({ conversions: null, leads: null, cpc: null, metrics_updated_at: null }),
    );
    expect(c.metrics.conversions).toBe(0);
    expect(c.metrics.leads).toBe(0);
    expect(c.metrics.cpc).toBe(0);
    expect(c.metrics.updatedAt).toBeUndefined();
  });
});

describe("isLaunched", () => {
  it("is true only once a Meta campaign id exists", () => {
    expect(isLaunched({ externalCampaignId: "ext1" })).toBe(true);
    expect(isLaunched({ externalCampaignId: undefined })).toBe(false);
  });
});

describe("boostDraftToRow (AC-3)", () => {
  const draft: BoostDraft = {
    name: "Test",
    videoId: "v9",
    objective: "notoriete",
    countries: ["FR"],
    ageMin: 20,
    ageMax: 40,
    gender: "femmes",
    budgetMode: "quotidien",
    budgetDaily: 30,
    budgetTotal: 200,
    startDate: "2026-08-01T00:00:00Z",
  };

  it("always drafts as brouillon with the server-set id/user", () => {
    const r = boostDraftToRow(draft, "user-1", "id-1");
    expect(r).toMatchObject({
      id: "id-1",
      user_id: "user-1",
      status: "brouillon",
      objective: "notoriete",
      audience_mode: "advantage",
      video_id: "v9",
      countries: ["FR"],
      budget_daily: 30,
      budget_total: 0,
    });
  });

  it("uses lifetime budget (and nulls daily) in total mode", () => {
    const r = boostDraftToRow({ ...draft, budgetMode: "total" }, "u", "i");
    expect(r.budget_mode).toBe("total");
    expect(r.budget_daily).toBeNull();
    expect(r.budget_total).toBe(200);
  });

  it("copies countries (no shared reference)", () => {
    const r = boostDraftToRow(draft, "u", "i");
    expect(r.countries).not.toBe(draft.countries);
  });
});

describe("SUPPORTED_OBJECTIVES", () => {
  it("is exactly the three Phase-1 objectives the backend honors", () => {
    expect(SUPPORTED_OBJECTIVES).toEqual(["notoriete", "trafic", "engagement"]);
  });
});
