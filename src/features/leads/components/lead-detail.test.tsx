import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LeadDetail } from "./lead-detail";
import { LeadsStoreProvider } from "../provider";
import type { LeadsDeps } from "../store";
import type { Lead } from "@/lib/vidcica/lead";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
  }),
}));

afterEach(cleanup);

const lead: Lead = {
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
};

function renderDetail() {
  const upsert = vi.fn(async () => {});
  const deps: LeadsDeps = {
    upsert,
    newId: () => "id1",
    now: () => "2026-07-13T00:00:00Z",
    download: vi.fn(),
  };
  render(
    <LeadsStoreProvider userId="u1" initial={[lead]} deps={deps}>
      <LeadDetail id="l1" fallback={lead} />
    </LeadsStoreProvider>,
  );
  return { upsert };
}

describe("<LeadDetail /> (AC-9/10)", () => {
  it("advances the status via the pipeline and writes through", () => {
    const { upsert } = renderDetail();
    fireEvent.click(screen.getByTestId("status-contacted"));
    expect(screen.getByTestId("status-contacted")).toHaveAttribute("aria-pressed", "true");
    expect(upsert).toHaveBeenCalledOnce();
  });

  it("adds a note and clears the input; rejects a blank note", () => {
    const { upsert } = renderDetail();
    fireEvent.click(screen.getByTestId("note-add")); // blank → disabled, no write
    expect(upsert).not.toHaveBeenCalled();

    fireEvent.change(screen.getByTestId("note-input"), { target: { value: "Client intéressé" } });
    fireEvent.click(screen.getByTestId("note-add"));
    // Appears in both the notes list and the timeline.
    expect(screen.getAllByText("Client intéressé").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("note-input")).toHaveValue("");
    expect(upsert).toHaveBeenCalledOnce();
  });

  it("logs a contact attempt on the timeline", () => {
    renderDetail();
    fireEvent.click(screen.getByTestId("contact-call"));
    expect(screen.getByTestId("timeline")).toHaveTextContent("Appel passé");
  });
});
