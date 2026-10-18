import { describe, expect, it } from "vitest";
import { aggregateCampaigns, billableCampaigns } from "./analytics";
import type { Campaign } from "./campaign";

const campaign = (over: Partial<Campaign>): Campaign => ({
  id: "c",
  name: "Boost",
  objective: "notoriete",
  status: "brouillon",
  budgetMode: "quotidien",
  budgetDaily: 5,
  budgetTotal: 0,
  startDate: "2026-10-01T00:00:00Z",
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
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
  ...over,
});

describe("ad spend in analytics", () => {
  // Regression (2026-10-18): a paused campaign that had spent CA$6.74 showed 0,
  // because only active and ended campaigns were counted. Meta's numbers are
  // lifetime totals: whatever the status now, that money was spent.
  it("counts every campaign that exists on Meta, paused or refused included", () => {
    const spent = (budgetSpent: number) => ({ ...campaign({}).metrics, budgetSpent });
    const list = [
      campaign({ id: "paused", status: "en_pause", externalCampaignId: "1", metrics: spent(6.74) }),
      campaign({ id: "refused", status: "rejected", externalCampaignId: "2", metrics: spent(1) }),
      campaign({ id: "active", status: "active", externalCampaignId: "3", metrics: spent(2) }),
      campaign({ id: "draft", status: "brouillon" }),
    ];
    expect(billableCampaigns(list).map((c) => c.id)).toEqual(["paused", "refused", "active"]);
    expect(aggregateCampaigns(list).totalSpend).toBeCloseTo(9.74);
  });
});
