import { describe, expect, it, vi } from "vitest";
import { runCheckout, type CheckoutDeps } from "./billing";

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
