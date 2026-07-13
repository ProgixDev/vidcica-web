import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Paywall } from "./paywall";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
// Billing calls are mocked so the paywall's outcome handling is testable.
const startCheckout = vi.fn(async () => ({
  ok: false as const,
  reason: "not_configured" as const,
}));
vi.mock("@/lib/vidcica/billing", () => ({
  startCheckout: (...a: unknown[]) => startCheckout(...(a as [])),
  openBillingPortal: vi.fn(async () => ({ ok: true as const })),
}));

afterEach(cleanup);

describe("<Paywall /> (AC-1, AC-2, AC-6)", () => {
  it("shows the current plan, credits, the four tiers, highlights, and the current marking", () => {
    render(<Paywall userId="" entitlement={{ plan: "free", credits: 12 }} />);
    expect(screen.getByTestId("current-plan")).toHaveTextContent("Gratuit");
    expect(screen.getByTestId("credits-balance")).toHaveTextContent("12");
    for (const id of ["free", "starter", "pro", "studio"]) {
      expect(screen.getByTestId(`plan-${id}`)).toBeInTheDocument();
    }
    // a feature highlight from the matrix is rendered
    expect(screen.getByText("· 150 crédits / mois")).toBeInTheDocument();
    // current plan is marked "Actuel"
    expect(screen.getByTestId("plan-free")).toHaveTextContent("Actuel");
    // free user can subscribe to the paid tiers, and has no manage button
    expect(screen.getByTestId("subscribe-starter")).toBeInTheDocument();
    expect(screen.getByTestId("subscribe-studio")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Gérer mon abonnement/ })).not.toBeInTheDocument();
  });

  it("a paid subscriber sees manage + can only upgrade higher tiers", () => {
    render(<Paywall userId="" entitlement={{ plan: "pro", credits: 300 }} />);
    expect(screen.getByTestId("current-plan")).toHaveTextContent("Pro");
    expect(screen.getByRole("button", { name: /Gérer mon abonnement/ })).toBeInTheDocument();
    expect(screen.getByTestId("subscribe-studio")).toBeInTheDocument();
    expect(screen.queryByTestId("subscribe-starter")).not.toBeInTheDocument();
    expect(screen.queryByTestId("subscribe-pro")).not.toBeInTheDocument();
  });
});

describe("<Paywall /> error state (AC-8)", () => {
  it("surfaces a not-configured message when checkout can't start", async () => {
    vi.stubGlobal(
      "open",
      vi.fn(() => null),
    );
    render(<Paywall userId="" entitlement={{ plan: "free", credits: 0 }} />);
    fireEvent.click(screen.getByTestId("subscribe-starter"));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/indisponible/i);
    vi.unstubAllGlobals();
  });
});
