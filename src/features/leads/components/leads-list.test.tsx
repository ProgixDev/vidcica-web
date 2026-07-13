import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LeadsList } from "./leads-list";
import { LeadsStoreProvider } from "../provider";
import type { LeadsDeps } from "../store";
import type { Lead } from "@/lib/vidcica/lead";

// The provider opens a realtime channel on mount — stub the browser client.
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
  }),
}));

afterEach(cleanup);

const lead = (over: Partial<Lead> = {}): Lead => ({
  id: "l1",
  campaignId: "c1",
  campaignName: "Promo été",
  firstName: "Marie",
  lastName: "Curie",
  email: "marie@example.com",
  phone: "+33600000000",
  capturedAt: "2026-07-10T00:00:00Z",
  score: 80,
  scoreBucket: "hot",
  status: "new",
  notes: [],
  interactions: [],
  ...over,
});

function renderList(initial: Lead[], download = vi.fn()) {
  const deps: LeadsDeps = {
    upsert: async () => {},
    newId: () => "id1",
    now: () => "2026-07-13T00:00:00Z",
    download,
  };
  render(
    <LeadsStoreProvider userId="u1" initial={initial} deps={deps}>
      <LeadsList />
    </LeadsStoreProvider>,
  );
  return { download };
}

describe("<LeadsList /> (AC-8/11)", () => {
  it("shows an honest empty state when there are no leads", () => {
    renderList([]);
    expect(screen.getByTestId("leads-empty")).toBeInTheDocument();
    expect(screen.getByText("Aucun prospect pour le moment")).toBeInTheDocument();
  });

  it("renders leads with a 'new' badge count", () => {
    renderList([lead({ id: "a", status: "new" }), lead({ id: "b", status: "converted" })]);
    expect(screen.getByTestId("leads-list")).toBeInTheDocument();
    expect(screen.getByTestId("leads-new-badge")).toHaveTextContent("1 nouveau");
  });

  it("exports all leads to CSV when none are selected", () => {
    const { download } = renderList([lead()]);
    fireEvent.click(screen.getByTestId("export-leads"));
    expect(download).toHaveBeenCalledOnce();
    expect(download.mock.calls[0]?.[1]).toContain("marie@example.com");
  });
});
