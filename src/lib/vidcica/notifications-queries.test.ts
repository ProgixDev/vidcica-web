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
  for (const m of ["select", "order", "limit"]) node[m] = rec(m);
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

import { listMyNotifications } from "./notifications-queries";

beforeEach(() => {
  calls = [];
  result = { data: [], error: null };
});

describe("listMyNotifications (AC-1)", () => {
  it("selects the notifications table newest first with the mapped columns", async () => {
    await listMyNotifications();
    const from = calls.find((c) => c.method === "from");
    const select = calls.find((c) => c.method === "select");
    const order = calls.find((c) => c.method === "order");
    expect(from?.args[0]).toBe("notifications");
    for (const col of ["id", "type", "category", "title", "read", "created_at"]) {
      expect(String(select?.args[0])).toContain(col);
    }
    expect(order?.args).toEqual(["created_at", { ascending: false }]);
  });

  it("returns [] on error", async () => {
    result = { data: null, error: { message: "boom" } };
    expect(await listMyNotifications()).toEqual([]);
  });
});
