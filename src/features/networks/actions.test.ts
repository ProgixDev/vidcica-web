import { beforeEach, describe, expect, it, vi } from "vitest";

type Call = { method: string; args: unknown[] };
let calls: Call[] = [];
let result: { data: unknown; error: unknown } = { data: [{ id: "row" }], error: null };
// What functions.invoke answers: data on 2xx, or an error whose context holds
// the status and JSON body (how supabase-js reports a non-2xx answer).
let invokeAnswer: { status: number; body: Record<string, unknown> } = { status: 200, body: {} };
const invoked: Array<{ fn: string; body: unknown }> = [];

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
    functions: {
      invoke: async (fn: string, opts: { body: unknown }) => {
        invoked.push({ fn, body: opts.body });
        const { status, body } = invokeAnswer;
        if (status >= 200 && status < 300) return { data: body, error: null };
        return { data: null, error: { context: { status, json: async () => body } } };
      },
    },
  })),
}));

import { disconnectMeta, disconnectNetwork, selectMetaPage, setNetworkPublish } from "./actions";

const uuid = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

beforeEach(() => {
  calls = [];
  result = { data: [{ id: "row" }], error: null };
  invokeAnswer = { status: 200, body: {} };
  invoked.length = 0;
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

  it("accepts the seeded `{userId}_{platform}` id format (regression)", async () => {
    // Real rows are keyed `…f37a8_yt`, not plain UUIDs — the old `.uuid()`
    // check rejected every one and silently broke toggle/disconnect.
    const id = `${uuid}_yt`;
    const out = await setNetworkPublish(id, true);
    expect(out).toEqual({ ok: true });
    const eq = calls.find((c) => c.method === "eq");
    expect(eq?.args).toEqual(["id", id]);
  });

  it("rejects a malformed rowId (bad chars) without touching the DB", async () => {
    const out = await disconnectNetwork("' OR 1=1 --");
    expect(out.ok).toBe(false);
    expect(calls.find((c) => c.method === "update")).toBeUndefined();
  });

  it("reports failure on a zero-row match (not the caller's row)", async () => {
    result = { data: [], error: null };
    const out = await setNetworkPublish(uuid, true);
    expect(out.ok).toBe(false);
  });
});

describe("Meta actions", () => {
  it("selectMetaPage sends the Page id to meta-select-page", async () => {
    invokeAnswer = { status: 200, body: { ok: true, pageId: "111" } };
    expect(await selectMetaPage("111")).toEqual({ ok: true });
    expect(invoked).toEqual([{ fn: "meta-select-page", body: { pageId: "111" } }]);
  });

  it("selectMetaPage refuses a malformed id without calling the server", async () => {
    expect(await selectMetaPage("abc;drop")).toEqual({ ok: false, reason: "page_unavailable" });
    expect(invoked).toHaveLength(0);
  });

  it("selectMetaPage passes the server reason through", async () => {
    invokeAnswer = { status: 422, body: { error: "page_unavailable" } };
    expect(await selectMetaPage("111")).toEqual({ ok: false, reason: "page_unavailable" });
  });

  it("disconnectMeta reports campaigns it could not pause, with the Ads Manager link", async () => {
    invokeAnswer = {
      status: 409,
      body: {
        error: "pause_failed",
        campaigns: [{ id: "c1", name: "Boost — promo" }],
        adsManagerUrl: "https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=1",
      },
    };
    expect(await disconnectMeta()).toEqual({
      ok: false,
      reason: "pause_failed",
      campaigns: ["Boost — promo"],
      adsManagerUrl: "https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=1",
    });
    expect(invoked).toEqual([{ fn: "meta-disconnect", body: { force: false } }]);
  });

  it("disconnectMeta with force goes through and says what still runs", async () => {
    invokeAnswer = {
      status: 200,
      body: { ok: true, paused: 0, stillRunning: 1, adsManagerUrl: "u" },
    };
    expect(await disconnectMeta(true)).toEqual({ ok: true, stillRunning: 1, adsManagerUrl: "u" });
    expect(invoked).toEqual([{ fn: "meta-disconnect", body: { force: true } }]);
  });
});
