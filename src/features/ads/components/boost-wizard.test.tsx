import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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

  it("shows the checking skeleton while the gate resolves (AC-12)", () => {
    renderWizard({ resolveAccount: () => new Promise(() => {}) }); // never resolves
    expect(screen.getByTestId("boost-checking")).toBeInTheDocument();
  });

  // Regression: the audience step offered five francophone countries only.
  it("searches every country and keeps worldwide exclusive", async () => {
    renderWizard({});
    fireEvent.change(await screen.findByTestId("bw-video"), { target: { value: "v1" } });
    for (let i = 0; i < 2; i++) fireEvent.click(screen.getByTestId("boost-next"));

    fireEvent.change(screen.getByTestId("bw-country-search"), { target: { value: "japon" } });
    expect(within(screen.getByTestId("bw-country-list")).getAllByRole("checkbox")).toHaveLength(1);
    fireEvent.click(screen.getByTestId("bw-country-JP"));
    const selected = () => screen.getByTestId("bw-countries-selected");
    expect(selected()).toHaveTextContent("France");
    expect(selected()).toHaveTextContent("Japon");

    fireEvent.click(screen.getByTestId("bw-country-ALL"));
    expect(selected()).toHaveTextContent("Monde entier");
    expect(selected()).not.toHaveTextContent("Japon");
  });

  // Regression: the budget step accepted any daily budget from 1, but activation
  // refuses anything under 5, so a CA$2 campaign was created that could never run.
  it("won't continue with a daily budget below the activation minimum", async () => {
    renderWizard({});
    fireEvent.change(await screen.findByTestId("bw-video"), { target: { value: "v1" } });
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByTestId("boost-next"));
    const budget = screen.getByTestId("bw-budget-daily");
    fireEvent.change(budget, { target: { value: "2" } });
    expect(screen.getByTestId("boost-next")).toBeDisabled();
    expect(screen.getByTestId("bw-budget-min")).toHaveTextContent(/Minimum .*5.* par jour/);
    fireEvent.change(budget, { target: { value: "5" } });
    expect(screen.getByTestId("boost-next")).toBeEnabled();
  });

  it("walks the steps and renders the created/in-review success (AC-3)", async () => {
    renderWizard({});
    // video step: pick a video (auto-fills the name) → then next through each step
    fireEvent.change(await screen.findByTestId("bw-video"), { target: { value: "v1" } });
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByTestId("boost-next"));
    fireEvent.click(screen.getByTestId("boost-submit"));
    expect(await screen.findByText("Campagne créée (en révision)")).toBeInTheDocument();
  });
});
