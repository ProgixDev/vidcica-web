import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { generatePlan, mapEnqueueReason } from "./generation";

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

  it("falls back to 'error' for unknown / undefined", () => {
    expect(mapEnqueueReason(undefined)).toBe("error");
    expect(mapEnqueueReason("some_new_code")).toBe("error");
  });
});

describe("generatePlan", () => {
  const supabase = {
    auth: { getSession: async () => ({ data: { session: { access_token: "t" } } }) },
  } as unknown as SupabaseClient<Database>;
  const reply = (status: number, body: unknown) =>
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify(body), { status }));
  afterEach(() => vi.unstubAllGlobals());

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
