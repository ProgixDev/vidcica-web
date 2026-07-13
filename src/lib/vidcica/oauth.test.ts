import { describe, expect, it, vi } from "vitest";
import { runNetworkOAuth, type OAuthDeps } from "./oauth";

function deps(over: Partial<OAuthDeps> = {}): OAuthDeps {
  return {
    start: async () => ({ ok: true, url: "https://provider/authorize" }),
    navigate: vi.fn(),
    isConnected: async () => false,
    wait: async () => {}, // no real delay in tests
    now: () => 0,
    ...over,
  };
}

function popup(over: { closed?: boolean } = {}) {
  return { closed: false, close: vi.fn(), ...over };
}

describe("runNetworkOAuth (AC-2/3/4)", () => {
  it("AC-4: platform_not_configured closes the popup, never navigates", async () => {
    const d = deps({ start: async () => ({ ok: false, reason: "platform_not_configured" }) });
    const pop = popup();
    const out = await runNetworkOAuth(d, pop);
    expect(out).toEqual({ ok: false, reason: "platform_not_configured" });
    expect(d.navigate).not.toHaveBeenCalled();
    expect(pop.close).toHaveBeenCalled();
  });

  it("AC-2: navigates then detects the connected row and closes the popup", async () => {
    let checks = 0;
    const d = deps({ isConnected: async () => ++checks >= 2 });
    const pop = popup();
    const out = await runNetworkOAuth(d, pop, { pollMs: 1 });
    expect(out).toEqual({ ok: true });
    expect(d.navigate).toHaveBeenCalledWith("https://provider/authorize");
    expect(pop.close).toHaveBeenCalled();
  });

  it("AC-3: popup closed before connecting → cancelled", async () => {
    const out = await runNetworkOAuth(
      deps({ isConnected: async () => false }),
      popup({ closed: true }),
    );
    expect(out).toEqual({ ok: false, reason: "cancelled" });
  });

  it("connect-then-close race still resolves ok", async () => {
    let n = 0;
    const out = await runNetworkOAuth(
      deps({ isConnected: async () => ++n >= 1 }),
      popup({ closed: true }),
    );
    expect(out).toEqual({ ok: true });
  });

  it("times out if never connected and popup stays open", async () => {
    let t = 0;
    const out = await runNetworkOAuth(
      deps({ now: () => (t += 60_000), isConnected: async () => false }),
      popup(),
      {
        timeoutMs: 120_000,
        pollMs: 1,
      },
    );
    expect(out).toEqual({ ok: false, reason: "timeout" });
  });

  it("a blocked (null) popup → error", async () => {
    const out = await runNetworkOAuth(deps(), null);
    expect(out.ok).toBe(false);
  });

  it("an aborted signal → cancelled and the popup is closed", async () => {
    const controller = new AbortController();
    controller.abort();
    const pop = popup();
    const out = await runNetworkOAuth(deps(), pop, { signal: controller.signal });
    expect(out).toEqual({ ok: false, reason: "cancelled" });
    expect(pop.close).toHaveBeenCalled();
  });
});
