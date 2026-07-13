import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActivatePauseControls } from "./activate-pause-controls";
import type { Campaign } from "@/lib/vidcica/campaign";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

afterEach(() => {
  cleanup();
  refresh.mockClear();
});

type C = Pick<Campaign, "id" | "status" | "externalCampaignId">;
const launched = (status: Campaign["status"]): C => ({
  id: "c1",
  status,
  externalCampaignId: "ext1",
});

describe("<ActivatePauseControls /> (AC-5/6)", () => {
  it("requires an explicit confirmation before activating (real spend)", async () => {
    const onSetStatus = vi.fn(async () => ({ ok: true as const, status: "active" as const }));
    render(<ActivatePauseControls campaign={launched("in_review")} onSetStatus={onSetStatus} />);

    fireEvent.click(screen.getByTestId("activate-btn"));
    expect(onSetStatus).not.toHaveBeenCalled(); // not fired until confirmed
    expect(screen.getByTestId("activate-confirm")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("activate-confirm-btn"));
    await waitFor(() => expect(onSetStatus).toHaveBeenCalledWith("c1", "activate"));
    expect(refresh).toHaveBeenCalled();
  });

  it("surfaces the monthly spend-cap error and does not refresh", async () => {
    const onSetStatus = vi.fn(async () => ({
      ok: false as const,
      reason: "monthly_cap_exceeded",
      cap: 50000,
    }));
    render(<ActivatePauseControls campaign={launched("en_pause")} onSetStatus={onSetStatus} />);
    fireEvent.click(screen.getByTestId("activate-btn"));
    fireEvent.click(screen.getByTestId("activate-confirm-btn"));
    expect(await screen.findByTestId("activate-error")).toHaveTextContent(/plafond/i);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("pauses an active campaign directly (no confirm)", async () => {
    const onSetStatus = vi.fn(async () => ({ ok: true as const, status: "en_pause" as const }));
    render(<ActivatePauseControls campaign={launched("active")} onSetStatus={onSetStatus} />);
    fireEvent.click(screen.getByTestId("pause-btn"));
    await waitFor(() => expect(onSetStatus).toHaveBeenCalledWith("c1", "pause"));
  });

  it("shows a note (no controls) for a not-yet-created brouillon", () => {
    render(
      <ActivatePauseControls
        campaign={{ id: "c1", status: "brouillon", externalCampaignId: undefined }}
      />,
    );
    expect(screen.getByTestId("campaign-draft-note")).toBeInTheDocument();
    expect(screen.queryByTestId("activate-btn")).not.toBeInTheDocument();
  });
});
