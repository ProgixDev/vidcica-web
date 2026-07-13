import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type Call = { method: string; args: unknown[] };
let calls: Call[] = [];
let result: { data: unknown; error: unknown } = { data: [], error: null };

function builder() {
  const node: Record<string, unknown> = {};
  const rec =
    (method: string) =>
    (...args: unknown[]) => {
      calls.push({ method, args });
      return node;
    };
  for (const m of ["select", "order", "eq", "maybeSingle"]) node[m] = rec(m);
  node.then = (resolve: (v: typeof result) => unknown) => resolve(result);
  return node;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: (...args: unknown[]) => {
      calls.push({ method: "from", args });
      return builder();
    },
  })),
}));

import { listMyNetworks } from "./networks-queries";

beforeEach(() => {
  calls = [];
  result = { data: [], error: null };
});

describe("listMyNetworks (AC-1)", () => {
  it("selects the networks table ordered by platform, with the mapped columns", async () => {
    await listMyNetworks();
    const from = calls.find((c) => c.method === "from");
    const select = calls.find((c) => c.method === "select");
    const order = calls.find((c) => c.method === "order");
    expect(from?.args[0]).toBe("networks");
    for (const col of ["id", "platform", "connected", "needs_reconnect", "publishes_enabled"]) {
      expect(String(select?.args[0])).toContain(col);
    }
    // never leaks the token ciphertext columns to the client
    expect(String(select?.args[0])).not.toContain("access_token_ciphertext");
    expect(order?.args[0]).toBe("platform");
  });

  it("returns [] on error (no throw)", async () => {
    result = { data: null, error: { message: "boom" } };
    expect(await listMyNetworks()).toEqual([]);
  });
});
