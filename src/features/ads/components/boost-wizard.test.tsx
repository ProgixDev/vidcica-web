import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BoostWizard, type VideoOption } from "./boost-wizard";
import { BoostStoreProvider } from "../provider";
import type { BoostDeps } from "../store";
import { I18nProvider } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/ads/new",
}));

afterEach(cleanup);

const videos: VideoOption[] = [{ id: "v1", title: "Ma vidéo" }];

function renderWizard(deps: Partial<BoostDeps>, vids: VideoOption[] = videos, locale?: Locale) {
  const full: BoostDeps = {
    resolveAccount: async () => ({ ok: true, hasAccount: true, hasPage: true }),
    createDraft: async () => ({ ok: true, id: "camp-1" }),
    createCampaign: async () => ({ ok: true, status: "in_review" }),
    ...deps,
  };
  const wizard = (
    <BoostStoreProvider deps={full}>
      <BoostWizard videos={vids} />
    </BoostStoreProvider>
  );
  render(locale ? <I18nProvider locale={locale}>{wizard}</I18nProvider> : wizard);
}

describe("<BoostWizard /> — why only a draft", () => {
  function renderGate(resolveAccount: BoostDeps["resolveAccount"]) {
    const deps: BoostDeps = {
      resolveAccount,
      createDraft: async () => ({ ok: true, id: "camp-1" }),
      createCampaign: async () => ({ ok: true, status: "in_review" }),
    };
    render(
      <BoostStoreProvider deps={deps}>
        <BoostWizard videos={videos} />
      </BoostStoreProvider>,
    );
  }

  it("points to Facebook when a (re)connect fixes it", async () => {
    renderGate(async () => ({ ok: false, reason: "needs_reconnect" }));
    const banner = await screen.findByTestId("boost-draft-banner");
    expect(banner).toHaveTextContent("Connectez Facebook");
    expect(screen.getByTestId("boost-connect-facebook")).toHaveAttribute("href", "/networks");
  });

  it("names a disabled ad account, which no reconnect fixes", async () => {
    renderGate(async () => ({ ok: false, reason: "ad_account_disabled" }));
    expect(await screen.findByTestId("boost-draft-banner")).toHaveTextContent("désactivé");
    expect(screen.queryByTestId("boost-connect-facebook")).not.toBeInTheDocument();
  });

  it("shows the account’s own minimum on the budget step", async () => {
    renderGate(async () => ({
      ok: true,
      hasAccount: true,
      hasPage: true,
      currency: "XOF",
      minDailyBudget: 3000,
    }));
    fireEvent.change(await screen.findByTestId("bw-video"), { target: { value: "v1" } });
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByTestId("boost-next"));
    // Intl puts a narrow no-break space in "3 000"; match any space.
    expect(screen.getByTestId("bw-budget-min")).toHaveTextContent(/3\s?000/);
  });
});

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

    expect(screen.queryByTestId("bw-country-worldwide-note")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("bw-country-ALL"));
    expect(selected()).toHaveTextContent("Monde entier");
    expect(selected()).not.toHaveTextContent("Japon");
    // Worldwide leaves out Singapore and Taiwan, and says so before money is spent.
    expect(screen.getByTestId("bw-country-worldwide-note")).toHaveTextContent(
      "Sauf Singapour et Taïwan",
    );
    for (let i = 0; i < 2; i++) fireEvent.click(screen.getByTestId("boost-next"));
    expect(screen.getByTestId("bw-review")).toHaveTextContent(
      "Monde entier (sauf Singapour et Taïwan)",
    );
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

  // Regression: a daily budget has no end date on Meta, so the campaign runs until
  // it is paused, and the budget step never said so (AC-20).
  it("says a daily budget runs every day until paused, with a month’s cost", async () => {
    renderWizard({
      resolveAccount: async () => ({ ok: true, hasAccount: true, hasPage: true, currency: "CAD" }),
    });
    fireEvent.change(await screen.findByTestId("bw-video"), { target: { value: "v1" } });
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByTestId("boost-next"));
    fireEvent.change(screen.getByTestId("bw-budget-daily"), { target: { value: "5" } });
    const runs = screen.getByTestId("bw-budget-runs");
    expect(runs).toHaveTextContent("jusqu’à ce que vous la mettiez en pause");
    expect(runs).toHaveTextContent(/environ 150\s?\$/);

    // A total budget ends on its own: no such line.
    fireEvent.change(screen.getByLabelText("Type de budget"), { target: { value: "total" } });
    expect(screen.queryByTestId("bw-budget-runs")).not.toBeInTheDocument();
  });

  // A total budget runs 7 days from its first activation, and both the budget
  // step and the review say so (AC-21).
  it("says a total budget runs 7 days from its activation, with the daily share", async () => {
    renderWizard({
      resolveAccount: async () => ({ ok: true, hasAccount: true, hasPage: true, currency: "CAD" }),
    });
    fireEvent.change(await screen.findByTestId("bw-video"), { target: { value: "v1" } });
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByTestId("boost-next"));
    fireEvent.change(screen.getByLabelText("Type de budget"), { target: { value: "total" } });
    fireEvent.change(screen.getByTestId("bw-budget-total"), { target: { value: "70" } });
    const ends = screen.getByTestId("bw-budget-ends");
    expect(ends).toHaveTextContent("La campagne dure 7 jours à partir de son activation");
    expect(ends).toHaveTextContent(/environ 10\s?\$/);

    fireEvent.click(screen.getByTestId("boost-next"));
    expect(screen.getByTestId("bw-review")).toHaveTextContent(/70\s?\$CA au total sur 7 jours/);
  });

  it("says it in English on an English page", async () => {
    renderWizard({}, videos, "en");
    fireEvent.change(await screen.findByTestId("bw-video"), { target: { value: "v1" } });
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByTestId("boost-next"));
    fireEvent.change(screen.getByTestId("bw-budget-daily"), { target: { value: "10" } });
    expect(screen.getByTestId("bw-budget-runs")).toHaveTextContent(
      /The campaign runs every day until you pause it, about .*300/,
    );
  });

  // Regression: Traffic was offered with nowhere to send people. Meta built the
  // campaign, ad set and creative, then refused the ad, leaving an empty campaign.
  it("asks Traffic for a website link and won't continue without a full one", async () => {
    const createDraft = vi.fn(async () => ({ ok: true, id: "camp-1" }) as const);
    renderWizard({ createDraft });
    fireEvent.change(await screen.findByTestId("bw-video"), { target: { value: "v1" } });
    fireEvent.click(screen.getByTestId("boost-next"));

    expect(screen.queryByTestId("bw-url")).not.toBeInTheDocument(); // Awareness: no link
    fireEvent.click(screen.getByTestId("bw-objective-trafic"));
    const url = screen.getByTestId("bw-url");
    expect(screen.getByTestId("boost-next")).toBeDisabled();
    fireEvent.change(url, { target: { value: "monsite" } });
    expect(screen.getByTestId("bw-url-hint")).toHaveTextContent(/adresse complète/);
    expect(screen.getByTestId("boost-next")).toBeDisabled();
    fireEvent.change(url, { target: { value: "https://monsite.fr" } });
    expect(screen.getByTestId("boost-next")).toBeEnabled();

    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByTestId("boost-next"));
    expect(screen.getByTestId("bw-review")).toHaveTextContent("https://monsite.fr");
    fireEvent.click(screen.getByTestId("boost-submit"));
    expect(await screen.findByText("Campagne créée (en révision)")).toBeInTheDocument();
    expect(createDraft).toHaveBeenCalledWith(
      expect.objectContaining({ objective: "trafic", url: "https://monsite.fr" }),
    );
  });

  // Regression: a failed launch said "Une erreur est survenue" on an English page.
  it("reports a failed launch in the page's language, with the saved draft", async () => {
    renderWizard(
      { createCampaign: async () => ({ ok: false, reason: "meta_error" }) },
      videos,
      "en",
    );
    fireEvent.change(await screen.findByTestId("bw-video"), { target: { value: "v1" } });
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByTestId("boost-next"));
    fireEvent.click(screen.getByTestId("boost-submit"));
    const error = await screen.findByTestId("boost-error");
    expect(error).toHaveTextContent(
      "Meta refused the campaign. The details are on the campaign page.",
    );
    expect(error).toHaveTextContent("View draft");
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
