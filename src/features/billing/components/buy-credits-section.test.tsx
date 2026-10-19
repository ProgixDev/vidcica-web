import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BuyCreditsSection } from "./buy-credits-section";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

const startCreditCheckout = vi.fn();
vi.mock("@/lib/vidcica/billing", () => ({
  startCreditCheckout: (...a: unknown[]) => startCreditCheckout(...a),
}));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));

// The live packs (credit_products, 2026-10-19).
const PACKS = [
  { credits: 50, priceEur: 10, label: "Découverte — 50 crédits" },
  { credits: 150, priceEur: 25, label: "Populaire — 150 crédits" },
  { credits: 500, priceEur: 75, label: "Pro — 500 crédits" },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "open",
    vi.fn(() => null),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("<BuyCreditsSection /> on the billing page", () => {
  it("shows each pack with its price, the price per credit and the saving", () => {
    render(<BuyCreditsSection packs={PACKS} layout="grid" id="packs" />);
    const section = screen.getByTestId("buy-credits");
    expect(section).toHaveAttribute("id", "packs");
    expect(screen.getByRole("heading")).toHaveTextContent("Recharger des crédits");

    const small = within(screen.getByTestId("pack-50"));
    expect(small.getByText(/^50\scrédits$/)).toBeInTheDocument();
    expect(small.getByText(/10\s€/)).toBeInTheDocument();
    expect(small.getByText(/0,20\s€ le crédit/)).toBeInTheDocument();
    expect(screen.getByTestId("pack-50")).not.toHaveTextContent("%");

    const mid = within(screen.getByTestId("pack-150"));
    expect(mid.getByText("Populaire")).toBeInTheDocument();
    expect(mid.getByText(/0,17\s€ le crédit/)).toBeInTheDocument();
    expect(screen.getByTestId("pack-150")).toHaveTextContent(/−17\s%/);
    expect(screen.getByTestId("pack-500")).toHaveTextContent(/−25\s%/);
  });

  it("buying opens Checkout for that pack and says when the credits are added", async () => {
    startCreditCheckout.mockResolvedValue({ ok: true });
    render(<BuyCreditsSection packs={PACKS} layout="grid" />);
    fireEvent.click(screen.getByTestId("buy-pack-150"));
    expect(startCreditCheckout).toHaveBeenCalledWith(
      expect.anything(),
      150,
      null,
      expect.anything(),
    );
    expect(await screen.findByTestId("buy-credits-message")).toHaveTextContent("Crédits ajoutés");
    expect(refresh).toHaveBeenCalled();
  });

  it("a payment still being confirmed reads as received, never failed", async () => {
    startCreditCheckout.mockResolvedValue({ ok: false, reason: "pending" });
    render(<BuyCreditsSection packs={PACKS} layout="grid" />);
    fireEvent.click(screen.getByTestId("buy-pack-50"));
    const message = await screen.findByTestId("buy-credits-message");
    expect(message).toHaveTextContent("Paiement reçu");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders nothing when no pack is on sale", () => {
    const { container } = render(<BuyCreditsSection packs={[]} layout="grid" />);
    expect(container).toBeEmptyDOMElement();
  });
});
