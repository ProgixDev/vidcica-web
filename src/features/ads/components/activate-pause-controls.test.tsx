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

  it("surfaces the below-min-budget error and does not refresh", async () => {
    const onSetStatus = vi.fn(async () => ({
      ok: false as const,
      reason: "below_min_budget",
      minDaily: 500,
    }));
    render(<ActivatePauseControls campaign={launched("in_review")} onSetStatus={onSetStatus} />);
    fireEvent.click(screen.getByTestId("activate-btn"));
    fireEvent.click(screen.getByTestId("activate-confirm-btn"));
    expect(await screen.findByTestId("activate-error")).toHaveTextContent(/budget/i);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("pauses an active campaign directly (no confirm)", async () => {
    const onSetStatus = vi.fn(async () => ({ ok: true as const, status: "en_pause" as const }));
    render(<ActivatePauseControls campaign={launched("active")} onSetStatus={onSetStatus} />);
    fireEvent.click(screen.getByTestId("pause-btn"));
    await waitFor(() => expect(onSetStatus).toHaveBeenCalledWith("c1", "pause"));
  });

  it("shows a note and a launch button (no activate) for a not-yet-created brouillon", () => {
    render(
      <ActivatePauseControls
        campaign={{ id: "c1", status: "brouillon", externalCampaignId: undefined }}
      />,
    );
    expect(screen.getByTestId("campaign-draft-note")).toBeInTheDocument();
    expect(screen.getByTestId("launch-btn")).toBeInTheDocument();
    expect(screen.queryByTestId("activate-btn")).not.toBeInTheDocument();
  });

  it("launches a saved draft on Meta, then re-reads the page", async () => {
    const onLaunch = vi.fn(async () => ({ ok: true as const, status: "in_review" }));
    render(
      <ActivatePauseControls
        campaign={{ id: "c1", status: "brouillon", externalCampaignId: undefined }}
        onLaunch={onLaunch}
      />,
    );
    fireEvent.click(screen.getByTestId("launch-btn"));
    await waitFor(() => expect(onLaunch).toHaveBeenCalledWith("c1"));
    expect(refresh).toHaveBeenCalled();
  });

  it("names the account’s minimum when a launch is refused for budget", async () => {
    const onLaunch = vi.fn(async () => ({
      ok: false as const,
      reason: "below_min_budget",
      minDaily: 5,
      currency: "CAD",
    }));
    render(
      <ActivatePauseControls
        campaign={{ id: "c1", status: "brouillon", externalCampaignId: undefined }}
        onLaunch={onLaunch}
      />,
    );
    fireEvent.click(screen.getByTestId("launch-btn"));
    expect(await screen.findByTestId("activate-error")).toHaveTextContent("5 $CA");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("without a plan with Boost: no launch, no activate, a plan note instead", () => {
    const { unmount } = render(
      <ActivatePauseControls
        campaign={{ id: "c1", status: "brouillon", externalCampaignId: undefined }}
        canBoost={false}
      />,
    );
    expect(screen.queryByTestId("launch-btn")).not.toBeInTheDocument();
    expect(screen.getByTestId("campaign-plan-note")).toBeInTheDocument();
    unmount();
    render(<ActivatePauseControls campaign={launched("en_pause")} canBoost={false} />);
    expect(screen.queryByTestId("activate-btn")).not.toBeInTheDocument();
    expect(screen.getByTestId("campaign-plan-note")).toBeInTheDocument();
  });

  it("keeps Pause for a running campaign even without a plan", () => {
    render(<ActivatePauseControls campaign={launched("active")} canBoost={false} />);
    expect(screen.getByTestId("pause-btn")).toBeInTheDocument();
  });

  it("offers Pause on a refused campaign: Meta’s WITH_ISSUES can still deliver", () => {
    render(<ActivatePauseControls campaign={launched("rejected")} />);
    expect(screen.getByTestId("pause-btn")).toBeInTheDocument();
  });

  it("links to Ads Manager when Meta refuses the pause", async () => {
    const onSetStatus = vi.fn(async () => ({
      ok: false as const,
      reason: "pause_in_ads_manager",
      adsManagerUrl: "https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=1",
    }));
    render(<ActivatePauseControls campaign={launched("active")} onSetStatus={onSetStatus} />);
    fireEvent.click(screen.getByTestId("pause-btn"));
    const error = await screen.findByTestId("activate-error");
    expect(error.querySelector("a")?.getAttribute("href")).toBe(
      "https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=1",
    );
  });
});
