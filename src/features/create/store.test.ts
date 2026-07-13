import { describe, expect, it } from "vitest";
import { createCreateStore, type CreateDeps, type EnqueueResult } from "./store";
import type { GeneratePlanOutcome, VideoPlan } from "@/lib/vidcica/generation";

const PLAN: VideoPlan = {
  title: "Titre",
  description: "Desc",
  hashtags: ["#a"],
  script: "script",
  segments: [{ index: 0, narration_fr: "n", visual_prompt_en: "v", duration_sec: 5 }],
};

function makeStore(over: Partial<CreateDeps> = {}) {
  const deps: CreateDeps = {
    plan: async (): Promise<GeneratePlanOutcome> => ({ ok: true, plan: PLAN }),
    enqueue: async (): Promise<EnqueueResult> => ({
      ok: true,
      videoId: "v1",
      jobId: "j1",
      charged: 12,
    }),
    ...over,
  };
  return createCreateStore(deps, { prompt: "un sujet de vidéo intéressant" });
}

describe("create store (AC-8..AC-11)", () => {
  it("AC-8: plan success → review with the plan populated", async () => {
    const s = makeStore();
    await s.getState().requestPlan();
    expect(s.getState().phase).toBe("review");
    expect(s.getState().plan?.title).toBe("Titre");
  });

  it("AC-9: plan not_configured → error phase, no plan", async () => {
    const s = makeStore({ plan: async () => ({ ok: false, reason: "not_configured" }) });
    await s.getState().requestPlan();
    expect(s.getState().phase).toBe("error");
    expect(s.getState().plan).toBeNull();
    expect(s.getState().error).toMatch(/indisponible/i);
  });

  it("AC-10: enqueue success → done with jobId + charged", async () => {
    const s = makeStore();
    await s.getState().requestPlan();
    await s.getState().confirmEnqueue();
    expect(s.getState().phase).toBe("done");
    expect(s.getState().result).toEqual({ videoId: "v1", jobId: "j1", charged: 12 });
  });

  it("AC-11: insufficient_credits → blocked (not error, no placeholder)", async () => {
    const s = makeStore({
      enqueue: async () => ({ ok: false, reason: "insufficient_credits" }),
    });
    await s.getState().requestPlan();
    await s.getState().confirmEnqueue();
    expect(s.getState().phase).toBe("blocked");
    expect(s.getState().blockedReason).toBe("insufficient_credits");
    expect(s.getState().result).toBeNull();
  });

  it("AC-11: model_not_allowed and not_live also block", async () => {
    for (const reason of ["model_locked", "not_live", "daily_cap"] as const) {
      const s = makeStore({ enqueue: async () => ({ ok: false, reason }) });
      await s.getState().requestPlan();
      await s.getState().confirmEnqueue();
      expect(s.getState().phase).toBe("blocked");
      expect(s.getState().blockedReason).toBe(reason);
    }
  });

  it("AC-11: a hard error uses the error phase", async () => {
    const s = makeStore({ enqueue: async () => ({ ok: false, reason: "error", message: "boom" }) });
    await s.getState().requestPlan();
    await s.getState().confirmEnqueue();
    expect(s.getState().phase).toBe("error");
    expect(s.getState().error).toBe("boom");
  });

  it("setInput patches the composer input", () => {
    const s = makeStore();
    s.getState().setInput({ kind: "script", length: 45 });
    expect(s.getState().input.kind).toBe("script");
    expect(s.getState().input.length).toBe(45);
  });
});
