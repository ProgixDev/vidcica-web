import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BoostWizard, type VideoOption } from "./boost-wizard";
import { BoostStoreProvider } from "../provider";
import type { BoostDeps } from "../store";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(cleanup);

const videos: VideoOption[] = [{ id: "v1", title: "Ma vidéo" }];

function renderWizard(deps: Partial<BoostDeps>, vids: VideoOption[] = videos) {
  const full: BoostDeps = {
    resolveAccount: async () => ({ ok: true, hasAccount: true, hasPage: true }),
    createDraft: async () => ({ ok: true, id: "camp-1" }),
    createCampaign: async () => ({ ok: true, status: "in_review" }),
    ...deps,
  };
  render(
    <BoostStoreProvider deps={full}>
      <BoostWizard videos={vids} />
    </BoostStoreProvider>,
  );
}

describe("<BoostWizard /> (AC-2)", () => {
  it("shows the honest draft-only banner when ads aren't configured", async () => {
    renderWizard({ resolveAccount: async () => ({ ok: false, reason: "ads_not_configured" }) });
    expect(await screen.findByTestId("boost-draft-banner")).toBeInTheDocument();
    expect(screen.getByTestId("boost-wizard")).toBeInTheDocument();
  });

  it("shows the real create path (no draft banner) when an account + page exist", async () => {
    renderWizard({});
    expect(await screen.findByTestId("bw-video")).toBeInTheDocument();
    expect(screen.queryByTestId("boost-draft-banner")).not.toBeInTheDocument();
  });

  it("guides the user to create a video when none are ready to boost", async () => {
    renderWizard({}, []);
    expect(await screen.findByText("Aucune vidéo prête à booster")).toBeInTheDocument();
  });
});
