import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { enqueueGeneration, generatePlan, mapEnqueueReason, readPlanBlock } from "./generation";

// The reason codes drive the block-with-recovery UX (AC-11) — keep in lockstep
// with the enqueue-generation edge function's error strings.
describe("mapEnqueueReason", () => {
  it("maps each known error string to its actionable reason", () => {
    expect(mapEnqueueReason("generation_not_live")).toBe("not_live");
    expect(mapEnqueueReason("insufficient_credits")).toBe("insufficient_credits");
    expect(mapEnqueueReason("daily_cap_reached")).toBe("daily_cap");
    expect(mapEnqueueReason("model_not_allowed")).toBe("model_locked");
    expect(mapEnqueueReason("already_in_progress")).toBe("in_progress");
    expect(mapEnqueueReason("video_has_no_plan")).toBe("no_plan");
    expect(mapEnqueueReason("too_many_segments")).toBe("no_plan");
    expect(mapEnqueueReason("image_not_supported")).toBe("image_not_supported");
    expect(mapEnqueueReason("generation_disabled")).toBe("disabled");
    // A script too long for 60 s: refused before the charge, with its own message.
    expect(mapEnqueueReason("script_too_long")).toBe("script_too_long");
    // The content filter re-reads the plan before the charge.
    expect(mapEnqueueReason("content_blocked")).toBe("content_blocked");
  });

  it("maps the plan refusals (brief section F) to their own reasons", () => {
    expect(mapEnqueueReason("duration_not_allowed")).toBe("duration_locked");
    expect(mapEnqueueReason("voice_not_allowed")).toBe("voice_locked");
    expect(mapEnqueueReason("library_full")).toBe("library_full");
    expect(mapEnqueueReason("storage_full")).toBe("storage_full");
    // The plan table could not be read: temporary, never a raw code on screen.
    expect(mapEnqueueReason("plan_unavailable")).toBe("not_live");
  });

  it("falls back to 'error' for unknown / undefined", () => {
    expect(mapEnqueueReason(undefined)).toBe("error");
    expect(mapEnqueueReason("some_new_code")).toBe("error");
  });
});

describe("readPlanBlock", () => {
  it("reads the plan, the plan that unlocks the request and the limit", () => {
    expect(
      readPlanBlock({
        error: "duration_not_allowed",
        plan: "free",
        requiredPlan: "starter",
        limit: 15,
      }),
    ).toEqual({ plan: "free", requiredPlan: "starter", limit: 15 });
    // Storage sends its limit in megabytes.
    expect(readPlanBlock({ plan: "starter", requiredPlan: "pro", limitMb: 500 })).toEqual({
      plan: "starter",
      requiredPlan: "pro",
      limit: 500,
    });
  });

  it("reads a missing or odd field as unknown", () => {
    expect(readPlanBlock({ plan: "gold", requiredPlan: null })).toEqual({
      plan: null,
      requiredPlan: null,
    });
    expect(readPlanBlock("nope")).toEqual({ plan: null, requiredPlan: null });
    expect(readPlanBlock({ plan: "pro", requiredPlan: "studio", limit: "90" })).toEqual({
      plan: "pro",
      requiredPlan: "studio",
    });
  });
});

describe("enqueueGeneration", () => {
  const supabase = {
    auth: { getSession: async () => ({ data: { session: { access_token: "t" } } }) },
  } as unknown as SupabaseClient<Database>;
  afterEach(() => vi.unstubAllGlobals());

  it("says it shows plan refusals (v: 2) and carries the plan that unlocks one", async () => {
    const sent: unknown[] = [];
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
      sent.push(JSON.parse(String(init.body)));
      return new Response(
        JSON.stringify({ error: "voice_not_allowed", plan: "free", requiredPlan: "starter" }),
        { status: 403 },
      );
    });
    const out = await enqueueGeneration(supabase, { videoId: "v1", segments: [], voiceover: true });
    expect(sent[0]).toMatchObject({ videoId: "v1", v: 2 });
    expect(out).toEqual({
      ok: false,
      reason: "voice_locked",
      message: "voice_not_allowed",
      block: { plan: "free", requiredPlan: "starter" },
    });
  });

  it("carries the longest video allowed when a script is too long", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(JSON.stringify({ error: "script_too_long", words: 200, maxSeconds: 30 }), {
          status: 422,
        }),
    );
    const out = await enqueueGeneration(supabase, { videoId: "v1", segments: [] });
    expect(out).toEqual({
      ok: false,
      reason: "script_too_long",
      message: "script_too_long",
      block: { plan: null, requiredPlan: null, limit: 30 },
    });
  });

  it("adds no plan detail to other refusals", async () => {
    vi.stubGlobal(
      "fetch",
      async () => new Response(JSON.stringify({ error: "daily_cap_reached" }), { status: 429 }),
    );
    const out = await enqueueGeneration(supabase, { videoId: "v1", segments: [] });
    expect(out).toEqual({ ok: false, reason: "daily_cap", message: "daily_cap_reached" });
    expect("block" in out).toBe(false);
  });
});

describe("generatePlan", () => {
  const supabase = {
    auth: { getSession: async () => ({ data: { session: { access_token: "t" } } }) },
  } as unknown as SupabaseClient<Database>;
  const reply = (status: number, body: unknown) =>
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify(body), { status }));
  afterEach(() => vi.unstubAllGlobals());

  it("says it shows plan refusals (v: 2)", async () => {
    const sent: unknown[] = [];
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
      sent.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ error: "ai_unreachable" }), { status: 502 });
    });
    await generatePlan(supabase, { prompt: "x", length: 30 });
    expect(sent[0]).toMatchObject({ prompt: "x", length: 30, v: 2 });
  });

  it("turns a length above the plan into a reason naming the plan that allows it", async () => {
    reply(403, { error: "duration_not_allowed", plan: "free", requiredPlan: "starter", limit: 15 });
    expect(await generatePlan(supabase, { prompt: "x", length: 30 })).toEqual({
      ok: false,
      reason: "duration_locked",
      block: { plan: "free", requiredPlan: "starter", limit: 15 },
    });
  });

  // Regression: a refused prompt printed the raw code ("ai_refused") as the error.
  it("turns a content refusal into a reason, not a raw code", async () => {
    for (const error of ["content_blocked", "ai_refused"]) {
      reply(422, { error, category: "sexual" });
      expect(await generatePlan(supabase, { prompt: "x" })).toEqual({
        ok: false,
        reason: "content_blocked",
      });
    }
  });

  it("keeps other failures as errors carrying the code", async () => {
    reply(502, { error: "ai_unreachable" });
    expect(await generatePlan(supabase, { prompt: "x" })).toEqual({
      ok: false,
      reason: "error",
      message: "ai_unreachable",
    });
  });
});
