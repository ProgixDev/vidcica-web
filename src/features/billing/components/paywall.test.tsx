import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Paywall } from "./paywall";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
afterEach(cleanup);

describe("<Paywall /> (AC-1, AC-2, AC-6)", () => {
  it("shows the current plan, credits, and the four tiers", () => {
    render(<Paywall userId="" entitlement={{ plan: "free", credits: 12 }} />);
    expect(screen.getByTestId("current-plan")).toHaveTextContent("Gratuit");
    expect(screen.getByTestId("credits-balance")).toHaveTextContent("12");
    for (const id of ["free", "starter", "pro", "studio"]) {
      expect(screen.getByTestId(`plan-${id}`)).toBeInTheDocument();
    }
    // free user can subscribe to the paid tiers, and has no manage button
    expect(screen.getByTestId("subscribe-starter")).toBeInTheDocument();
    expect(screen.getByTestId("subscribe-studio")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Gérer mon abonnement/ })).not.toBeInTheDocument();
  });

  it("a paid subscriber sees manage + can only upgrade higher tiers", () => {
    render(<Paywall userId="" entitlement={{ plan: "pro", credits: 300 }} />);
    expect(screen.getByTestId("current-plan")).toHaveTextContent("Pro");
    expect(screen.getByRole("button", { name: /Gérer mon abonnement/ })).toBeInTheDocument();
    // only Studio is an upgrade from Pro
    expect(screen.getByTestId("subscribe-studio")).toBeInTheDocument();
    expect(screen.queryByTestId("subscribe-starter")).not.toBeInTheDocument();
    expect(screen.queryByTestId("subscribe-pro")).not.toBeInTheDocument();
  });
});
