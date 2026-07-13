import { describe, expect, it } from "vitest";
import { removeCampaign, upsertCampaign } from "./use-campaigns-realtime";
import type { Campaign } from "./campaign";

const c = (id: string, status: Campaign["status"] = "active"): Campaign =>
  ({
    id,
    name: id,
    objective: "trafic",
    status,
    budgetMode: "quotidien",
    budgetTotal: 0,
    startDate: "2026-07-01T00:00:00Z",
    countries: ["FR"],
    metrics: {
      budgetSpent: 0,
      reach: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      leads: 0,
      cpm: 0,
      ctr: 0,
      cpc: 0,
    },
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
  }) as Campaign;

describe("upsertCampaign (AC-1 realtime)", () => {
  it("prepends a genuinely new campaign", () => {
    expect(upsertCampaign([c("a")], c("b")).map((x) => x.id)).toEqual(["b", "a"]);
  });

  it("replaces in place without reordering on a status change", () => {
    const list = [c("a"), c("b")];
    const next = upsertCampaign(list, c("a", "en_pause"));
    expect(next.map((x) => x.id)).toEqual(["a", "b"]);
    expect(next[0]?.status).toBe("en_pause");
  });
});

describe("removeCampaign", () => {
  it("drops the campaign by id", () => {
    expect(removeCampaign([c("a"), c("b")], "a").map((x) => x.id)).toEqual(["b"]);
  });
});
