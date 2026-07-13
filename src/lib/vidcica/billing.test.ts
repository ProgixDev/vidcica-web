import { afterEach, describe, expect, it, vi } from "vitest";
import { openBillingPortal, runCheckout, startCheckout, type CheckoutDeps } from "./billing";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Minimal fake Supabase client: a session token + a profiles read.
function fakeSupabase(tier = "free"): SupabaseClient<Database> {
  return {
    auth: { getSession: async () => ({ data: { session: { access_token: "t" } } }) },
    from: () => ({ select: () => ({ maybeSingle: async () => ({ data: { tier } }) }) }),
  } as unknown as SupabaseClient<Database>;
}

function fakePopup() {
  return { closed: false, close: vi.fn(), location: { href: "" } } as unknown as Window;
}

function stubFetch(status: number, body: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ status, ok: status >= 200 && status < 300, json: async () => body })),
  );
}

afterEach(() => vi.unstubAllGlobals());

function deps(over: Partial<CheckoutDeps> = {}): CheckoutDeps {
  return {
    start: async () => ({ ok: true, url: "https://checkout.stripe.com/x" }),
    navigate: vi.fn(),
    hasUpgraded: async () => false,
    wait: async () => {},
    now: () => 0,
    ...over,
  };
}

function popup(over: { closed?: boolean } = {}) {
  return { closed: false, close: vi.fn(), ...over };
}

describe("runCheckout (AC-3/4/5)", () => {
  it("AC-5: not_configured closes the popup, never navigates", async () => {
    const d = deps({ start: async () => ({ ok: false, reason: "not_configured" }) });
    const pop = popup();
    const out = await runCheckout(d, pop);
    expect(out).toEqual({ ok: false, reason: "not_configured" });
    expect(d.navigate).not.toHaveBeenCalled();
    expect(pop.close).toHaveBeenCalled();
  });

  it("AC-3: navigates then detects the tier upgrade and closes the popup", async () => {
    let n = 0;
    const d = deps({ hasUpgraded: async () => ++n >= 2 });
    const pop = popup();
    const out = await runCheckout(d, pop, { pollMs: 1 });
    expect(out).toEqual({ ok: true });
    expect(d.navigate).toHaveBeenCalledWith("https://checkout.stripe.com/x");
    expect(pop.close).toHaveBeenCalled();
  });

  it("AC-4: popup closed without upgrading → cancelled", async () => {
    const out = await runCheckout(
      deps({ hasUpgraded: async () => false }),
      popup({ closed: true }),
    );
    expect(out).toEqual({ ok: false, reason: "cancelled" });
  });

  it("pay-then-close race still resolves ok", async () => {
    let n = 0;
    const out = await runCheckout(
      deps({ hasUpgraded: async () => ++n >= 1 }),
      popup({ closed: true }),
    );
    expect(out).toEqual({ ok: true });
  });

  it("times out if the upgrade never lands", async () => {
    let t = 0;
    const out = await runCheckout(
      deps({ now: () => (t += 90_000), hasUpgraded: async () => false }),
      popup(),
      {
        timeoutMs: 180_000,
        pollMs: 1,
      },
    );
    expect(out).toEqual({ ok: false, reason: "timeout" });
  });

  it("a blocked (null) popup → error", async () => {
    const out = await runCheckout(deps(), null);
    expect(out.ok).toBe(false);
  });
});

describe("startCheckout HTTP mapping (AC-5)", () => {
  it("maps 503 to not_configured (no navigation, popup closed)", async () => {
    stubFetch(503, {});
    const pop = fakePopup();
    const out = await startCheckout(fakeSupabase(), "pro", pop);
    expect(out).toEqual({ ok: false, reason: "not_configured" });
    expect(pop.close as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalled();
  });

  it("maps a non-ok response to error", async () => {
    stubFetch(500, { error: "boom" });
    const out = await startCheckout(fakeSupabase(), "pro", fakePopup());
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.reason).toBe("error");
  });
});

describe("openBillingPortal (AC-6)", () => {
  it("opens the portal in the popup on success", async () => {
    stubFetch(200, { url: "https://billing.stripe.com/p" });
    const pop = fakePopup();
    const out = await openBillingPortal(fakeSupabase(), pop);
    expect(out).toEqual({ ok: true });
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
