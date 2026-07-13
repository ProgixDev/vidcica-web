import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CampaignDetail } from "./campaign-detail";
import type { Campaign } from "@/lib/vidcica/campaign";

// CampaignDetail renders ActivatePauseControls (a client leaf using useRouter).
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(cleanup);

const base: Campaign = {
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
};

describe("<CampaignDetail /> (AC-7)", () => {
  it("shows the honest 'en attente' affordance and zeros before any sync", () => {
    render(
      <CampaignDetail campaign={{ ...base, metrics: { ...base.metrics, updatedAt: undefined } }} />,
    );
    expect(screen.getByTestId("metrics-pending")).toHaveTextContent(/en attente/i);
    expect(screen.queryByText(/Mis à jour/)).not.toBeInTheDocument();
  });

  it("shows the update timestamp (no pending) once the cron has synced metrics", () => {
    render(
      <CampaignDetail
        campaign={{
          ...base,
          metrics: { ...base.metrics, impressions: 3120, updatedAt: "2026-07-13T09:00:00Z" },
        }}
      />,
    );
    expect(screen.queryByTestId("metrics-pending")).not.toBeInTheDocument();
    expect(screen.getByText(/Mis à jour/)).toBeInTheDocument();
    expect(screen.getByText("3 120")).toBeInTheDocument();
  });
});
