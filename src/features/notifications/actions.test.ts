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
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    from: (...args: unknown[]) => {
      calls.push({ method: "from", args });
      return builder();
    },
  })),
}));

import { markAllRead, markRead } from "./actions";

const uuid = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

beforeEach(() => {
  calls = [];
  result = { data: [{ id: "row" }], error: null };
});

describe("markRead (AC-4)", () => {
  it("updates read=true for the row and validates the uuid", async () => {
    const out = await markRead(uuid);
    expect(out).toEqual({ ok: true });
    const update = calls.find((c) => c.method === "update");
    expect((update?.args[0] as { read?: boolean }).read).toBe(true);
    expect((update?.args[0] as { read_at?: string }).read_at).toBeTypeOf("string");
    expect(calls.find((c) => c.method === "eq")?.args).toEqual(["id", uuid]);
  });

  it("rejects a non-uuid id without touching the DB", async () => {
    const out = await markRead("nope");
    expect(out.ok).toBe(false);
    expect(calls.find((c) => c.method === "update")).toBeUndefined();
  });

  it("reports failure on a zero-row match", async () => {
    result = { data: [], error: null };
    expect((await markRead(uuid)).ok).toBe(false);
  });
});

describe("markAllRead (AC-5)", () => {
  it("updates read=true where read=false", async () => {
    result = { data: null, error: null };
    const out = await markAllRead();
    expect(out).toEqual({ ok: true });
    expect((calls.find((c) => c.method === "update")?.args[0] as { read?: boolean }).read).toBe(
      true,
    );
    expect(calls.find((c) => c.method === "eq")?.args).toEqual(["read", false]);
  });
});
