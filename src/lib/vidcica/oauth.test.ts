import { describe, expect, it, vi } from "vitest";
import { runNetworkOAuth, type OAuthDeps } from "./oauth";

function deps(over: Partial<OAuthDeps>): OAuthDeps {
  return {
    start: async () => ({ ok: true, url: "https://provider/authorize" }),
    openPopup: () => ({ closed: false, close: vi.fn() }),
    isConnected: async () => false,
    wait: async () => {}, // no real delay in tests
    now: () => 0,
    ...over,
  };
}

describe("runNetworkOAuth (AC-2/3/4)", () => {
  it("AC-4: platform_not_configured short-circuits, no popup", async () => {
    const openPopup = vi.fn();
    const out = await runNetworkOAuth(
      deps({ start: async () => ({ ok: false, reason: "platform_not_configured" }), openPopup }),
    );
    expect(out).toEqual({ ok: false, reason: "platform_not_configured" });
    expect(openPopup).not.toHaveBeenCalled();
  });

  it("AC-2: detects the connected row and closes the popup", async () => {
    const close = vi.fn();
    let checks = 0;
    const out = await runNetworkOAuth(
      deps({
        openPopup: () => ({ closed: false, close }),
        isConnected: async () => ++checks >= 2, // connects on the 2nd poll
      }),
      { pollMs: 1 },
    );
    expect(out).toEqual({ ok: true });
    expect(close).toHaveBeenCalled();
  });

  it("AC-3: popup closed before connecting → cancelled", async () => {
    const popup = { closed: true, close: vi.fn() };
    const out = await runNetworkOAuth(
      deps({ openPopup: () => popup, isConnected: async () => false }),
    );
    expect(out).toEqual({ ok: false, reason: "cancelled" });
  });

  it("connect-then-close race still resolves ok", async () => {
    const popup = { closed: true, close: vi.fn() };
    let n = 0;
    const out = await runNetworkOAuth(
      deps({ openPopup: () => popup, isConnected: async () => ++n >= 1 }),
    );
    expect(out).toEqual({ ok: true });
  });

  it("times out if never connected and popup stays open", async () => {
    let t = 0;
    const out = await runNetworkOAuth(
      deps({ now: () => (t += 60_000), isConnected: async () => false }),
      { timeoutMs: 120_000, pollMs: 1 },
    );
    expect(out).toEqual({ ok: false, reason: "timeout" });
  });

  it("blocked popup → error", async () => {
    const out = await runNetworkOAuth(deps({ openPopup: () => null }));
    expect(out.ok).toBe(false);
  });
});
