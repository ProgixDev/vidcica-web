import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CampaignList } from "./campaign-list";
import type { Campaign } from "@/lib/vidcica/campaign";

// userId="" makes useCampaignsRealtime skip the subscription (no client needed).
afterEach(cleanup);

const campaign = (over: Partial<Campaign> = {}): Campaign => ({
  id: "c1",
  name: "Boost — Astuces",
  objective: "trafic",
  status: "active",
  budgetMode: "quotidien",
  budgetDaily: 25,
  budgetTotal: 0,
  startDate: "2026-07-01T00:00:00Z",
  countries: ["FR"],
  externalCampaignId: "ext1",
  metrics: {
    budgetSpent: 42,
    reach: 100,
    impressions: 3120,
    clicks: 89,
    conversions: 2,
    leads: 1,
    cpm: 3,
    ctr: 2,
    cpc: 0.3,
  },
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
  ...over,
});

describe("<CampaignList /> (AC-1)", () => {
  it("renders an empty state with the boost CTA when there are no campaigns", () => {
    render(<CampaignList userId="" initial={[]} />);
    expect(screen.getByTestId("ads-empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Booster une vidéo" })).toHaveAttribute(
      "href",
      "/ads/new",
    );
  });

  it("renders campaigns with status + budget + metric cells", () => {
    render(<CampaignList userId="" initial={[campaign()]} />);
    expect(screen.getByTestId("campaign-list")).toBeInTheDocument();
    expect(screen.getByTestId("campaign-status-c1")).toHaveTextContent("Active");
    expect(screen.getByText(/Trafic · 25 €\/jour/)).toBeInTheDocument();
    expect(screen.getByText("3 120")).toBeInTheDocument(); // impressions, fr-FR grouping
  });
});
