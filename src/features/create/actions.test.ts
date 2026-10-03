import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_COMPOSER_INPUT } from "./schema";
import type { VideoPlan } from "@/lib/vidcica/generation";

// Mock at the network boundary only: the Supabase client and the edge function.
const enqueueGeneration = vi.fn(async (_s: unknown, _i: { videoId: string }) => ({
  ok: true as const,
  jobId: "job-1",
  charged: 0,
}));
vi.mock("@/lib/vidcica/generation", () => ({
  enqueueGeneration: (s: unknown, i: { videoId: string }) => enqueueGeneration(s, i),
  generatePlan: vi.fn(),
}));

type Filter = [string, string, unknown];
function fakeSupabase(updatedRows: Array<{ id: string }>) {
  const calls = {
    update: [] as Array<Record<string, unknown>>,
    filters: [] as Filter[],
    insert: [] as Array<Record<string, unknown>>,
  };
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
    from: () => ({
      update: (payload: Record<string, unknown>) => {
        calls.update.push(payload);
        const chain = {
          eq: (col: string, val: unknown) => (calls.filters.push(["eq", col, val]), chain),
          is: (col: string, val: unknown) => (calls.filters.push(["is", col, val]), chain),
          select: async () => ({ data: updatedRows, error: null }),
        };
        return chain;
      },
      insert: async (row: Record<string, unknown>) => {
        calls.insert.push(row);
        return { error: null };
      },
    }),
  };
  return { calls, client };
}

let fake = fakeSupabase([]);
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => fake.client }));

import { enqueueAction } from "./actions";

const input = { ...DEFAULT_COMPOSER_INPUT, prompt: "Three tips to get better reviews fast" };
const plan: VideoPlan = {
  title: "Boost Your Review Game Quick Tips",
  description: "Get better reviews.",
  hashtags: ["#reviews"],
  script: "Want better reviews? Ask right after the sale.",
  segments: [
    {
      index: 0,
      narration_fr: "Ask right after the sale.",
      visual_prompt_en: "A shop counter",
      duration_sec: 5,
    },
  ],
};

afterEach(() => vi.clearAllMocks());

describe("enqueueAction — continuing a draft", () => {
  // Regression: generating from a draft always inserted a brand-new row, so the
  // draft stayed in the library beside its own video.
  it("renders the draft in place instead of creating a second video", async () => {
    fake = fakeSupabase([{ id: "vid_9tl7z65s" }]);
    const res = await enqueueAction(input, plan, "vid_9tl7z65s");

    expect(res).toMatchObject({ ok: true, videoId: "vid_9tl7z65s" });
    expect(fake.calls.insert).toHaveLength(0);
    expect(fake.calls.update[0]).toMatchObject({ title: plan.title, video_url: null });
    expect(fake.calls.filters).toEqual(
      expect.arrayContaining([
        ["eq", "id", "vid_9tl7z65s"],
        ["eq", "status", "brouillon"],
        ["is", "deleted_at", null],
      ]),
    );
    expect(enqueueGeneration.mock.calls[0]?.[1].videoId).toBe("vid_9tl7z65s");
  });

  it("falls back to a new video when the draft no longer qualifies", async () => {
    fake = fakeSupabase([]); // rendered, trashed, or someone else's: zero rows
    const res = await enqueueAction(input, plan, "vid_9tl7z65s");

    expect(fake.calls.insert).toHaveLength(1);
    const newId = fake.calls.insert[0]?.id;
    expect(newId).not.toBe("vid_9tl7z65s");
    expect(res).toMatchObject({ ok: true, videoId: newId });
  });

  it("ignores a malformed draft id and creates a new video", async () => {
    fake = fakeSupabase([{ id: "x" }]);
    await enqueueAction(input, plan, "not a valid id!");

    expect(fake.calls.update).toHaveLength(0);
    expect(fake.calls.insert).toHaveLength(1);
  });
});
