import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyPlanChange,
  openBillingPortal,
  planStatus,
  previewPlanChange,
  runCheckout,
  startCheckout,
  startCreditCheckout,
  type CheckoutDeps,
  type PlanPreview,
} from "./billing";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Minimal fake Supabase client: a session token, a profiles read and the
// stripe_pack ledger read (ids served in order, then the last one repeats).
function fakeSupabase(
  tier = "free",
  ledgerIds: (string | null)[] = [null],
): SupabaseClient<Database> {
  let n = 0;
  const ledger = {
    select: () => ledger,
    eq: () => ledger,
    order: () => ledger,
    limit: async () => {
      const id = ledgerIds[Math.min(n++, ledgerIds.length - 1)];
      return { data: id ? [{ id }] : [] };
    },
  };
  return {
    auth: { getSession: async () => ({ data: { session: { access_token: "t" } } }) },
    from: (table: string) =>
      table === "credit_ledger"
        ? ledger
        : { select: () => ({ maybeSingle: async () => ({ data: { tier } }) }) },
  } as unknown as SupabaseClient<Database>;
}

function fakePopup() {
  return { closed: false, close: vi.fn(), location: { href: "" } } as unknown as Window;
}

function stubFetch(status: number, body: Record<string, unknown>) {
  const fn = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>(async () => ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

function deps(over: Partial<CheckoutDeps> = {}): CheckoutDeps {
  return {
    start: async () => ({ ok: true, url: "https://checkout.stripe.com/x" }),
    navigate: vi.fn(),
    hasUpgraded: async () => false,
    returnStatus: () => null,
    wait: async () => {},
    now: () => 0,
    ...over,
  };
}

function popup(over: { closed?: boolean } = {}) {
  return { closed: false, close: vi.fn(), ...over };
}

/** A clock that moves `step` ms each time it is read. */
function clock(step: number) {
  let t = 0;
  return () => (t += step);
}

describe("runCheckout (AC-3/4/5, AC-12)", () => {
  it("AC-5: not_configured closes the popup, never navigates", async () => {
    const d = deps({ start: async () => ({ ok: false, reason: "not_configured" }) });
    const pop = popup();
    const out = await runCheckout(d, pop);
    expect(out).toEqual({ ok: false, reason: "not_configured" });
    expect(d.navigate).not.toHaveBeenCalled();
    expect(pop.close).toHaveBeenCalled();
  });

  it("AC-12: a subscriber is refused a second subscription, before any navigation", async () => {
    const d = deps({ start: async () => ({ ok: false, reason: "has_subscription" }) });
    const pop = popup();
    expect(await runCheckout(d, pop)).toEqual({ ok: false, reason: "has_subscription" });
    expect(d.navigate).not.toHaveBeenCalled();
    expect(pop.close).toHaveBeenCalled();
  });

  it("AC-3: navigates then detects the purchase and closes the popup", async () => {
    let n = 0;
    const d = deps({ hasUpgraded: async () => ++n >= 2 });
    const pop = popup();
    const out = await runCheckout(d, pop, { pollMs: 1 });
    expect(out).toEqual({ ok: true });
    expect(d.navigate).toHaveBeenCalledWith("https://checkout.stripe.com/x");
    expect(pop.close).toHaveBeenCalled();
  });

  it("the return page's cancel ends the wait at once", async () => {
    const pop = popup();
    const out = await runCheckout(deps({ returnStatus: () => "cancel" }), pop);
    expect(out).toEqual({ ok: false, reason: "cancelled" });
    expect(pop.close).toHaveBeenCalled();
  });

  it("AC-4: a closed popup counts as cancelled only after the grace period", async () => {
    const hasUpgraded = vi.fn(async () => false);
    const out = await runCheckout(
      deps({ hasUpgraded, now: clock(5_000) }),
      popup({ closed: true }),
      { closedGraceMs: 15_000 },
    );
    expect(out).toEqual({ ok: false, reason: "cancelled" });
    // Polled several times during the grace, not cancelled on the first look.
    expect(hasUpgraded.mock.calls.length).toBeGreaterThan(2);
  });

  it("a popup that looks closed (a bank page) but pays within the grace resolves ok", async () => {
    let n = 0;
    const out = await runCheckout(
      deps({ hasUpgraded: async () => ++n >= 3, now: clock(1_000) }),
      popup({ closed: true }),
      { closedGraceMs: 15_000 },
    );
    expect(out).toEqual({ ok: true });
  });

  // Regression: after 180 s the site said "Le paiement a échoué" even when the
  // payment went through and only the webhook was slow.
  it("a reported payment the account doesn't show yet is pending, never failed", async () => {
    const out = await runCheckout(
      deps({ returnStatus: () => "success", now: clock(10_000) }),
      popup({ closed: true }),
      { confirmMs: 60_000 },
    );
    expect(out).toEqual({ ok: false, reason: "pending" });
  });

  it("a popup left open past the limit stops the wait as pending", async () => {
    const pop = popup();
    const out = await runCheckout(deps({ now: clock(60_000) }), pop, { maxOpenMs: 600_000 });
    expect(out).toEqual({ ok: false, reason: "pending" });
    expect(pop.close).toHaveBeenCalled();
  });

  it("a blocked (null) popup → error", async () => {
    const out = await runCheckout(deps(), null);
    expect(out.ok).toBe(false);
  });
});

describe("startCheckout HTTP mapping (AC-5, AC-12)", () => {
  it("maps 503 to not_configured (no navigation, popup closed)", async () => {
    stubFetch(503, {});
    const pop = fakePopup();
    const out = await startCheckout(fakeSupabase(), "pro", pop);
    expect(out).toEqual({ ok: false, reason: "not_configured" });
    expect(pop.close as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalled();
  });

  it("maps 409 has_subscription", async () => {
    stubFetch(409, { error: "has_subscription" });
    expect(await startCheckout(fakeSupabase(), "pro", fakePopup())).toEqual({
      ok: false,
      reason: "has_subscription",
    });
  });

  it("sends its own origin so Stripe returns to /checkout/return", async () => {
    const fetchFn = stubFetch(500, { error: "boom" });
    const out = await startCheckout(fakeSupabase(), "pro", fakePopup());
    expect(out).toMatchObject({ ok: false, reason: "error" });
    const body = JSON.parse(String(fetchFn.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ plan: "pro", returnOrigin: window.location.origin });
  });
});

describe("startCreditCheckout (AC-12)", () => {
  it("a new stripe_pack ledger row means the pack was bought", async () => {
    stubFetch(200, { url: "https://checkout.stripe.com/pack" });
    const pop = fakePopup();
    // Before opening: row "old". First poll: still "old". Second: "new".
    const out = await startCreditCheckout(fakeSupabase("free", ["old", "old", "new"]), 50, pop, {
      pollMs: 1,
    });
    expect(out).toEqual({ ok: true });
    expect(pop.location.href).toBe("https://checkout.stripe.com/pack");
  });
});

describe("openBillingPortal (AC-6)", () => {
  it("opens the portal in the popup on success", async () => {
    stubFetch(200, { url: "https://billing.stripe.com/p" });
    const pop = fakePopup();
    const out = await openBillingPortal(fakeSupabase(), pop);
    expect(out.ok).toBe(true);
    expect(pop.location.href).toBe("https://billing.stripe.com/p");
  });

  it("maps 400 no_customer", async () => {
    stubFetch(400, { error: "no_customer" });
    const out = await openBillingPortal(fakeSupabase(), fakePopup());
    expect(out).toEqual({ ok: false, reason: "no_customer" });
  });

  it("maps 503 not_configured", async () => {
    stubFetch(503, {});
    const out = await openBillingPortal(fakeSupabase(), fakePopup());
    expect(out).toEqual({ ok: false, reason: "not_configured" });
  });

  it("a blocked (null) popup → error", async () => {
    const out = await openBillingPortal(fakeSupabase(), null);
    expect(out.ok).toBe(false);
  });
});

const SUB = {
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

describe("change-plan client (AC-9..AC-11)", () => {
  it("reads the live subscription, or null", async () => {
    stubFetch(200, { ok: true, subscription: SUB });
    expect(await planStatus(fakeSupabase("starter"))).toEqual({ ok: true, subscription: SUB });
    stubFetch(200, { ok: true, subscription: null });
    expect(await planStatus(fakeSupabase())).toEqual({ ok: true, subscription: null });
  });

  it("refuses a malformed answer rather than trusting it", async () => {
    stubFetch(200, { ok: true, subscription: { id: 1 } });
    expect(await planStatus(fakeSupabase())).toEqual({ ok: false, reason: "bad_response" });
  });

  it("an upgrade preview carries the amount due today and the quote to confirm", async () => {
    const preview = {
      ok: true,
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
    };
    stubFetch(200, preview);
    const out = await previewPlanChange(fakeSupabase("starter"), "pro");
    expect(out.ok && out.preview.kind === "upgrade" && out.preview.dueToday).toBe(1000);
  });

  it("confirming sends the quoted date, price and the request id", async () => {
    const fetchFn = stubFetch(200, { ok: true, kind: "upgraded", plan: "pro" });
    const preview: PlanPreview = {
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
    };
    const out = await applyPlanChange(fakeSupabase("starter"), preview, "req-12345678");
    expect(out).toEqual({ ok: true, result: { kind: "upgraded", plan: "pro" } });
    expect(JSON.parse(String(fetchFn.mock.calls[0]?.[1]?.body))).toEqual({
      action: "apply",
      plan: "pro",
      prorationDate: 1_790_000_000,
      quotedFrom: "price_starter",
      requestId: "req-12345678",
    });
  });

  it("a payment waiting on the bank comes back with its invoice page", async () => {
    stubFetch(409, { error: "payment_pending", url: "https://invoice.stripe.com/i/x" });
    expect(await previewPlanChange(fakeSupabase("starter"), "pro")).toEqual({
      ok: false,
      reason: "payment_pending",
      url: "https://invoice.stripe.com/i/x",
    });
  });
});
