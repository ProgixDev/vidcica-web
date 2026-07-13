import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type Call = { method: string; args: unknown[] };
let calls: Call[] = [];
const results = new Map<string, { data: unknown; error: unknown }>();

function builder(table: string) {
  const node: Record<string, unknown> = {};
  const rec =
    (method: string) =>
    (...args: unknown[]) => {
      calls.push({ method: `${table}.${method}`, args });
      return node;
    };
  for (const m of ["select", "maybeSingle"]) node[m] = rec(m);
  node.then = (resolve: (v: { data: unknown; error: unknown }) => unknown) =>
    resolve(results.get(table) ?? { data: null, error: null });
  return node;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: (table: string) => {
      calls.push({ method: "from", args: [table] });
      return builder(table);
    },
  })),
}));

import { getMyEntitlement } from "./billing-queries";

beforeEach(() => {
  calls = [];
  results.clear();
});

describe("getMyEntitlement (AC-1)", () => {
  it("reads profiles.tier and credits_accounts.balance", async () => {
    results.set("profiles", { data: { tier: "pro" }, error: null });
    results.set("credits_accounts", { data: { balance: 275 }, error: null });
    const ent = await getMyEntitlement();
    expect(ent).toEqual({ plan: "pro", credits: 275 });
    expect(calls.some((c) => c.method === "from" && c.args[0] === "profiles")).toBe(true);
    expect(calls.some((c) => c.method === "from" && c.args[0] === "credits_accounts")).toBe(true);
  });

  it("defaults to free / 0 when rows are missing", async () => {
    const ent = await getMyEntitlement();
    expect(ent).toEqual({ plan: "free", credits: 0 });
  });
});
