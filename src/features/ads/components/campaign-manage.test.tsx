import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CampaignManageControls } from "./campaign-manage";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("../actions", () => ({
  deleteCampaign: vi.fn(async () => ({ ok: true })),
  duplicateCampaign: vi.fn(async () => ({ ok: true, id: "copy" })),
}));

afterEach(cleanup);

describe("<CampaignManageControls /> — what can be deleted", () => {
  it("offers Delete for a draft and an ended campaign", () => {
    for (const status of ["brouillon", "terminee"] as const) {
      const { unmount } = render(<CampaignManageControls campaign={{ id: "c1", status }} />);
      expect(screen.getByTestId("delete-btn")).toBeInTheDocument();
      unmount();
    }
  });

  // `rejected` covers Meta's WITH_ISSUES, which can still be live and spending:
  // deleting the row would orphan that spend.
  it("never offers Delete for anything Meta may still deliver", () => {
    for (const status of ["rejected", "active", "en_pause", "in_review"] as const) {
      const { unmount } = render(<CampaignManageControls campaign={{ id: "c1", status }} />);
      expect(screen.queryByTestId("delete-btn")).not.toBeInTheDocument();
      expect(screen.getByTestId("delete-blocked")).toBeInTheDocument();
      unmount();
    }
  });
});
