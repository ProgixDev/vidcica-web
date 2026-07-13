import { beforeEach, describe, expect, it, vi } from "vitest";

type Call = { method: string; args: unknown[] };
let calls: Call[] = [];
let result: { data: unknown; error: unknown } = { data: [{ id: "row" }], error: null };

function builder() {
  const node: Record<string, unknown> = {};
  const rec =
    (method: string) =>
    (...args: unknown[]) => {
      calls.push({ method, args });
      return node;
    };
  for (const m of ["update", "eq", "select"]) node[m] = rec(m);
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

import { disconnectNetwork, setNetworkPublish } from "./actions";

const uuid = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

beforeEach(() => {
  calls = [];
  result = { data: [{ id: "row" }], error: null };
});

describe("network actions (AC-5)", () => {
  it("disconnectNetwork patches connected/publish/last_sync off for the row", async () => {
    const out = await disconnectNetwork(uuid);
    expect(out).toEqual({ ok: true });
    const update = calls.find((c) => c.method === "update");
    expect(update?.args[0]).toEqual({
      connected: false,
      publishes_enabled: false,
      last_sync: null,
    });
    const eq = calls.find((c) => c.method === "eq");
    expect(eq?.args).toEqual(["id", uuid]);
  });

  it("setNetworkPublish patches only publishes_enabled", async () => {
    await setNetworkPublish(uuid, false);
    const update = calls.find((c) => c.method === "update");
    expect(update?.args[0]).toEqual({ publishes_enabled: false });
  });

  it("rejects a non-uuid rowId without touching the DB", async () => {
    const out = await disconnectNetwork("not-a-uuid");
    expect(out.ok).toBe(false);
    expect(calls.find((c) => c.method === "update")).toBeUndefined();
  });

  it("reports failure on a zero-row match (not the caller's row)", async () => {
    result = { data: [], error: null };
    const out = await setNetworkPublish(uuid, true);
    expect(out.ok).toBe(false);
  });
});
