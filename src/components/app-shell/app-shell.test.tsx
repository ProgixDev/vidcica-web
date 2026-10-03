import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/lib/vidcica/use-credits-realtime", () => ({
  useCreditsRealtime: (_userId: string, initial: number) => initial,
}));

import { AppShell } from "./app-shell";

afterEach(cleanup);

function renderShell() {
  render(
    <AppShell
      userId="u1"
      email="play@vidcica.com"
      planLabel="Studio"
      credits={869}
      monthlyCredits={600}
    >
      <p>page</p>
    </AppShell>,
  );
}

describe("<AppShell /> on a phone", () => {
  // Regression: at 390 px the top bar held the menu, logo, credits, language,
  // theme and bell. It ran 55 px wide, pushing the bell off screen and letting
  // every page scroll sideways.
  it("moves the language and theme switches from the top bar into the menu", () => {
    renderShell();
    const barLanguage = screen.getByRole("group", { name: "Langue / Language" });
    expect(barLanguage.closest("div.hidden")).toHaveClass("sm:flex");

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le menu" }));
    const prefs = screen.getByTestId("drawer-preferences");
    expect(prefs).toHaveClass("sm:hidden");
    expect(within(prefs).getByRole("group", { name: "Langue / Language" })).toBeInTheDocument();
    expect(
      within(prefs).getByRole("button", { name: "Basculer le thème clair ou sombre" }),
    ).toBeInTheDocument();
  });
});
