import { beforeEach, describe, expect, it, vi } from "vitest";

// server-only throws outside an RSC bundle; stub it for the unit test.
vi.mock("server-only", () => ({}));

// Record every call on a thenable chain stub so we can assert the query shape
// (table, columns, ordering) without a real database.
type Call = { method: string; args: unknown[] };
let calls: Call[] = [];
let result: { data: unknown; error: unknown } = { data: [], error: null };

// Query builder: chainable + thenable (so `await builder` resolves the result).
function builder() {
  const node: Record<string, unknown> = {};
  const rec =
    (method: string) =>
    (...args: unknown[]) => {
      calls.push({ method, args });
      return node;
    };
  for (const m of ["select", "eq", "is", "order", "limit", "maybeSingle"]) {
    node[m] = rec(m);
  }
  node.then = (resolve: (v: typeof result) => unknown) => resolve(result);
  return node;
}

// Client: NOT thenable (so `await createClient()` returns the client, not a row).
function client() {
  return {
    from: (...args: unknown[]) => {
      calls.push({ method: "from", args });
      return builder();
    },
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => client()),
}));

import { listMyVideos, getLatestJob } from "./queries";

beforeEach(() => {
  calls = [];
  result = { data: [], error: null };
});

describe("listMyVideos (AC-5)", () => {
  it("selects the videos table, newest first, excluding trashed", async () => {
    await listMyVideos();
    const from = calls.find((c) => c.method === "from");
    const select = calls.find((c) => c.method === "select");
    const is = calls.find((c) => c.method === "is");
    const order = calls.find((c) => c.method === "order");
    expect(from?.args[0]).toBe("videos");
    // every field rowToVideo reads must be in the projection (interim-types drift guard)
    for (const col of ["id", "title", "video_url", "status", "duration_sec", "created_at"]) {
      expect(String(select?.args[0])).toContain(col);
    }
    expect(is?.args).toEqual(["deleted_at", null]);
    expect(order?.args).toEqual(["created_at", { ascending: false }]);
  });

  it("returns [] on error (no throw)", async () => {
    result = { data: null, error: { message: "boom" } };
    expect(await listMyVideos()).toEqual([]);
  });
});

describe("getLatestJob", () => {
  it("reads generation_jobs for the video, most recent first", async () => {
    result = { data: null, error: null };
    await getLatestJob("vid_1");
    const from = calls.find((c) => c.method === "from");
    const eq = calls.find((c) => c.method === "eq");
    const order = calls.find((c) => c.method === "order");
    expect(from?.args[0]).toBe("generation_jobs");
    expect(eq?.args).toEqual(["video_id", "vid_1"]);
    expect(order?.args).toEqual(["created_at", { ascending: false }]);
  });
});
