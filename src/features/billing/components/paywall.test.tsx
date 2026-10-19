import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Paywall } from "./paywall";
import type { SubscriptionView } from "@/lib/vidcica/billing";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

// Billing calls are mocked so the paywall's outcome handling is testable.
const startCheckout = vi.fn();
const planStatus = vi.fn();
const previewPlanChange = vi.fn();
const applyPlanChange = vi.fn();
const keepCurrentPlan = vi.fn();
const cancelSubscription = vi.fn();
const resumeSubscription = vi.fn();
const waitForPlan = vi.fn();
vi.mock("@/lib/vidcica/billing", () => ({
  startCheckout: (...a: unknown[]) => startCheckout(...a),
  openBillingPortal: vi.fn(async () => ({ ok: true as const, closed: new Promise(() => {}) })),
  planStatus: (...a: unknown[]) => planStatus(...a),
  previewPlanChange: (...a: unknown[]) => previewPlanChange(...a),
  applyPlanChange: (...a: unknown[]) => applyPlanChange(...a),
  keepCurrentPlan: (...a: unknown[]) => keepCurrentPlan(...a),
  cancelSubscription: (...a: unknown[]) => cancelSubscription(...a),
  resumeSubscription: (...a: unknown[]) => resumeSubscription(...a),
  waitForPlan: (...a: unknown[]) => waitForPlan(...a),
}));

const SUB: SubscriptionView = {
  id: "sub_1",
  plan: "starter",
  status: "active",
  periodEnd: "2026-11-18T10:00:00.000Z",
  cancelAt: null,
  pending: null,
  paymentPending: null,
  card: { brand: "visa", last4: "4242", type: "card" },
  currency: "eur",
  monthly: 2500,
  changeable: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  startCheckout.mockResolvedValue({ ok: false, reason: "not_configured" });
  planStatus.mockResolvedValue({ ok: true, subscription: null });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("<Paywall /> (AC-1, AC-2, AC-6)", () => {
  it("shows the current plan, credits, the four tiers, highlights, and the current marking", () => {
    render(<Paywall userId="" entitlement={{ plan: "free", credits: 12 }} />);
    expect(screen.getByTestId("current-plan")).toHaveTextContent("Gratuit");
    expect(screen.getByTestId("credits-balance")).toHaveTextContent("12");
    for (const id of ["free", "starter", "pro", "studio"]) {
      expect(screen.getByTestId(`plan-${id}`)).toBeInTheDocument();
    }
    expect(screen.getByText("150 crédits / mois")).toBeInTheDocument();
    expect(screen.getByTestId("plan-free")).toHaveTextContent("Actuel");
    // A Free account subscribes through Checkout and has no card button; it
    // has no subscription to look up either.
    expect(screen.getByTestId("subscribe-starter")).toBeInTheDocument();
    expect(screen.getByTestId("subscribe-studio")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Carte et factures/ })).not.toBeInTheDocument();
    expect(planStatus).not.toHaveBeenCalled();
  });

  it("a plan given by hand (no Stripe subscription) keeps Checkout for higher tiers", async () => {
    render(<Paywall userId="" entitlement={{ plan: "pro", credits: 300 }} />);
    await waitFor(() => expect(planStatus).toHaveBeenCalled());
    expect(await screen.findByTestId("subscribe-studio")).toBeInTheDocument();
    expect(screen.queryByTestId("subscribe-starter")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Carte et factures/ })).toBeInTheDocument();
  });
});

describe("<Paywall /> checkout outcomes (AC-8, AC-12)", () => {
  it("surfaces a not-configured message when checkout can't start", async () => {
    vi.stubGlobal(
      "open",
      vi.fn(() => null),
    );
    render(<Paywall userId="" entitlement={{ plan: "free", credits: 0 }} />);
    fireEvent.click(screen.getByTestId("subscribe-starter"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/indisponible/i);
  });

  // Regression: a slow webhook after a successful payment read "Le paiement a échoué".
  it("a payment that is still being activated says so, not failed", async () => {
    vi.stubGlobal(
      "open",
      vi.fn(() => null),
    );
    startCheckout.mockResolvedValue({ ok: false, reason: "pending" });
    render(<Paywall userId="" entitlement={{ plan: "free", credits: 0 }} />);
    fireEvent.click(screen.getByTestId("subscribe-starter"));
    const notice = await screen.findByTestId("billing-notice");
    expect(notice).toHaveTextContent("Paiement reçu");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("returning to the billing tab after paying (no popup) says the plan is activating", () => {
    render(<Paywall userId="" entitlement={{ plan: "free", credits: 0 }} returnStatus="success" />);
    expect(screen.getByTestId("billing-notice")).toHaveTextContent("Paiement reçu");
  });
});

describe("<Paywall /> plan changes for a subscriber (AC-9..AC-11)", () => {
  beforeEach(() => planStatus.mockResolvedValue({ ok: true, subscription: SUB }));

  it("a subscriber gets change buttons, never Checkout, and sees the renewal date", async () => {
    render(<Paywall userId="" entitlement={{ plan: "starter", credits: 150 }} />);
    expect(await screen.findByTestId("change-pro")).toBeInTheDocument();
    expect(screen.getByTestId("change-studio")).toBeInTheDocument();
    expect(screen.getByTestId("cancel-subscription")).toBeInTheDocument();
    expect(screen.queryByTestId("subscribe-pro")).not.toBeInTheDocument();
    expect(screen.getByTestId("renews-on")).toHaveTextContent("18 novembre 2026");
  });

  it("an upgrade shows the amount due today before anything is charged", async () => {
    previewPlanChange.mockResolvedValue({
      ok: true,
      preview: {
        kind: "upgrade",
        plan: "pro",
        currency: "eur",
        dueToday: 1000,
        monthly: 4500,
        prorationDate: 1_790_000_000,
        quotedFrom: "price_starter",
        card: SUB.card,
        dropsDowngrade: false,
        resumesCancellation: false,
      },
    });
    applyPlanChange.mockResolvedValue({ ok: true, result: { kind: "upgraded", plan: "pro" } });
    waitForPlan.mockResolvedValue(true);
    render(<Paywall userId="" entitlement={{ plan: "starter", credits: 150 }} />);
    fireEvent.click(await screen.findByTestId("change-pro"));
    expect(await screen.findByTestId("change-due-today")).toHaveTextContent(/10\s?€ aujourd’hui/);
    const panel = screen.getByTestId("plan-change-panel");
    expect(panel).toHaveTextContent("45 € par mois");
    expect(panel).toHaveTextContent("visa •••• 4242");
    expect(applyPlanChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("change-confirm"));
    await waitFor(() => expect(applyPlanChange).toHaveBeenCalled());
    expect(await screen.findByTestId("billing-notice")).toHaveTextContent(
      "Votre offre Pro est active.",
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("a confirmation already running elsewhere waits for the plan instead of failing", async () => {
    previewPlanChange.mockResolvedValue({
      ok: true,
      preview: {
        kind: "upgrade",
        plan: "pro",
        currency: "eur",
        dueToday: 1000,
        monthly: 4500,
        prorationDate: 1_790_000_000,
        quotedFrom: "price_starter",
        card: SUB.card,
        dropsDowngrade: false,
        resumesCancellation: false,
      },
    });
    applyPlanChange.mockResolvedValue({ ok: false, reason: "in_progress" });
    waitForPlan.mockResolvedValue(true);
    render(<Paywall userId="" entitlement={{ plan: "starter", credits: 150 }} />);
    fireEvent.click(await screen.findByTestId("change-pro"));
    fireEvent.click(await screen.findByTestId("change-confirm"));
    expect(await screen.findByTestId("billing-notice")).toHaveTextContent(
      "Votre offre Pro est active.",
    );
    expect(waitForPlan).toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("when the bank asks for 3-D Secure, the invoice opens from a button click", async () => {
    previewPlanChange.mockResolvedValue({
      ok: true,
      preview: {
        kind: "upgrade",
        plan: "pro",
        currency: "eur",
        dueToday: 1000,
        monthly: 4500,
        prorationDate: 1_790_000_000,
        quotedFrom: "price_starter",
        card: null,
        dropsDowngrade: false,
        resumesCancellation: false,
      },
    });
    applyPlanChange.mockResolvedValue({
      ok: true,
      result: { kind: "action_required", plan: "pro", url: "https://invoice.stripe.com/i/x" },
    });
    waitForPlan.mockResolvedValue(true);
    const open = vi.fn(() => null);
    vi.stubGlobal("open", open);
    render(<Paywall userId="" entitlement={{ plan: "starter", credits: 150 }} />);
    fireEvent.click(await screen.findByTestId("change-pro"));
    fireEvent.click(await screen.findByTestId("change-confirm"));
    const button = await screen.findByTestId("change-action");
    // Nothing opened by itself after the async call (popup blockers).
    expect(open).not.toHaveBeenCalled();
    fireEvent.click(button);
    expect(open).toHaveBeenCalledWith(
      "https://invoice.stripe.com/i/x",
      "vidcica-checkout",
      expect.any(String),
    );
  });

  it("a downgrade is scheduled for the end of the paid month, then can be kept back", async () => {
    planStatus.mockResolvedValue({
      ok: true,
      subscription: { ...SUB, plan: "pro", monthly: 4500 },
    });
    previewPlanChange.mockResolvedValue({
      ok: true,
      preview: { kind: "downgrade", plan: "starter", effectiveAt: SUB.periodEnd, currency: "eur" },
    });
    applyPlanChange.mockResolvedValue({
      ok: true,
      result: { kind: "scheduled", plan: "starter", effectiveAt: SUB.periodEnd },
    });
    render(<Paywall userId="" entitlement={{ plan: "pro", credits: 300 }} />);
    fireEvent.click(await screen.findByTestId("change-starter"));
    const panel = await screen.findByTestId("plan-change-panel");
    expect(panel).toHaveTextContent("Vous gardez Pro jusqu’au 18 novembre 2026");
    expect(panel).toHaveTextContent("Rien n’est débité aujourd’hui");

    planStatus.mockResolvedValue({
      ok: true,
      subscription: { ...SUB, plan: "pro", pending: { plan: "starter", at: SUB.periodEnd } },
    });
    fireEvent.click(screen.getByTestId("change-confirm"));
    expect(await screen.findByTestId("notice-pending")).toHaveTextContent(
      "Passage à Starter prévu le 18 novembre 2026.",
    );

    keepCurrentPlan.mockResolvedValue({ ok: true, result: { kind: "kept", plan: "pro" } });
    fireEvent.click(screen.getByTestId("sub-keep"));
    await waitFor(() => expect(keepCurrentPlan).toHaveBeenCalled());
  });

  it("cancelling keeps the plan until the end of the period, and can be resumed", async () => {
    cancelSubscription.mockResolvedValue({
      ok: true,
      result: { kind: "cancel_scheduled", at: SUB.periodEnd },
    });
    render(<Paywall userId="" entitlement={{ plan: "starter", credits: 150 }} />);
    fireEvent.click(await screen.findByTestId("cancel-subscription"));
    expect(await screen.findByTestId("plan-change-panel")).toHaveTextContent(
      "reste active jusqu’au 18 novembre 2026",
    );
    planStatus.mockResolvedValue({ ok: true, subscription: { ...SUB, cancelAt: SUB.periodEnd } });
    fireEvent.click(screen.getByTestId("cancel-confirm"));
    expect(await screen.findByTestId("notice-cancel-at")).toHaveTextContent(
      "Votre abonnement se termine le 18 novembre 2026.",
    );

    resumeSubscription.mockResolvedValue({ ok: true, result: { kind: "resumed" } });
    fireEvent.click(screen.getByTestId("sub-resume"));
    await waitFor(() => expect(resumeSubscription).toHaveBeenCalled());
  });

  it("a failed renewal blocks changes and points to the card", async () => {
    planStatus.mockResolvedValue({
      ok: true,
      subscription: { ...SUB, status: "past_due", changeable: false },
    });
    render(<Paywall userId="" entitlement={{ plan: "starter", credits: 150 }} />);
    expect(await screen.findByTestId("notice-payment-issue")).toBeInTheDocument();
    expect(screen.getByTestId("change-pro")).toBeDisabled();
  });
});
