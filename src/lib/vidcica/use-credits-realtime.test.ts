import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { nextBalance, useCreditsRealtime } from "./use-credits-realtime";

// Capture the postgres_changes callback so we can drive the subscription.
let handler: ((payload: { new: { balance?: number | null } }) => void) | null = null;
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => ({
      on: (_evt: string, _cfg: unknown, cb: typeof handler) => {
        handler = cb;
        return { subscribe: () => ({}) };
      },
    }),
    removeChannel: vi.fn(),
  }),
}));

describe("nextBalance (AC-7 merge)", () => {
  it("takes the new balance when present", () => {
    expect(nextBalance(100, { balance: 88 })).toBe(88);
    expect(nextBalance(100, { balance: 0 })).toBe(0);
  });
  it("keeps the current balance when the payload has none", () => {
    expect(nextBalance(100, {})).toBe(100);
    expect(nextBalance(100, { balance: null })).toBe(100);
  });
});

describe("useCreditsRealtime (AC-7 live wiring)", () => {
  it("updates the balance when a credits_accounts change arrives", () => {
    handler = null;
    const { result } = renderHook(() => useCreditsRealtime("u1", 100));
    expect(result.current).toBe(100);
    expect(handler).toBeTypeOf("function");
    act(() => handler!({ new: { balance: 42 } }));
    expect(result.current).toBe(42);
  });
});
