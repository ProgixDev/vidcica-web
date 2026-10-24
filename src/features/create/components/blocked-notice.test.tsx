import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BlockedNotice } from "./blocked-notice";

afterEach(cleanup);

describe("<BlockedNotice /> — plan refusals (brief B3–B5, section F)", () => {
  it("names the plan's length limit and the plan that allows more", () => {
    render(
      <BlockedNotice
        reason="duration_locked"
        block={{ plan: "free", requiredPlan: "starter", limit: 15 }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ton offre Gratuit permet des vidéos jusqu’à 15 s.",
    );
    const upgrade = screen.getByTestId("blocked-upgrade");
    expect(upgrade).toHaveTextContent("Passer à l’offre Starter");
    expect(upgrade).toHaveAttribute("href", "/billing");
  });

  it("writes long limits the mockup's way", () => {
    render(
      <BlockedNotice
        reason="duration_locked"
        block={{ plan: "pro", requiredPlan: "studio", limit: 90 }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ton offre Pro permet des vidéos jusqu’à 1 min 30.",
    );
    expect(screen.getByTestId("blocked-upgrade")).toHaveTextContent("Passer à l’offre Studio");
  });

  it("uses the mockup's voice-over line", () => {
    render(
      <BlockedNotice reason="voice_locked" block={{ plan: "free", requiredPlan: "starter" }} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Voix off et sous-titres : réservés à partir de l’offre Starter.",
    );
  });

  it("offers the library as well as a bigger plan when storage is full", () => {
    render(
      <BlockedNotice
        reason="storage_full"
        block={{ plan: "starter", requiredPlan: "pro", limit: 500 }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ton stockage est plein : l’offre Starter comprend 500 Mo.",
    );
    expect(screen.getByTestId("blocked-upgrade")).toHaveTextContent("Passer à l’offre Pro");
    expect(screen.getByTestId("blocked-videos")).toHaveAttribute("href", "/videos");
  });

  it("falls back to a plain message and the plans page without plan details", () => {
    render(<BlockedNotice reason="library_full" block={null} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ta bibliothèque est pleine. Supprime des vidéos ou passe à l’offre supérieure.",
    );
    expect(screen.getByTestId("blocked-upgrade")).toHaveTextContent("Voir les offres");
  });

  it("names the plan's longest video when a script is too long", () => {
    render(
      <BlockedNotice
        reason="script_too_long"
        block={{ plan: null, requiredPlan: null, limit: 30 }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ce script est trop long pour une vidéo de 30 s.",
    );
    expect(screen.queryByTestId("blocked-upgrade")).toBeNull();
  });

  it("sends a short balance to the credit packs", () => {
    render(<BlockedNotice reason="insufficient_credits" block={null} />);
    expect(screen.getByTestId("blocked-packs")).toHaveAttribute("href", "/billing#packs");
    expect(screen.queryByTestId("blocked-upgrade")).toBeNull();
  });
});
