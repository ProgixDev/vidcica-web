import { describe, expect, it } from "vitest";
import { VideoPlanSchema } from "./schema";

const validPlan = {
  title: "Titre",
  description: "desc",
  hashtags: ["#a"],
  script: "script",
  segments: [{ index: 0, narration_fr: "n", visual_prompt_en: "v", duration_sec: 5 }],
};

describe("VideoPlanSchema (server-boundary guard)", () => {
  it("accepts a well-formed plan", () => {
    expect(VideoPlanSchema.safeParse(validPlan).success).toBe(true);
  });

  it("rejects an empty title and a plan with no segments", () => {
    expect(VideoPlanSchema.safeParse({ ...validPlan, title: "" }).success).toBe(false);
    expect(VideoPlanSchema.safeParse({ ...validPlan, segments: [] }).success).toBe(false);
  });

  it("rejects an oversized segment list (bloat guard)", () => {
    const many = Array.from({ length: 31 }, (_, i) => ({
      index: i,
      narration_fr: "n",
      visual_prompt_en: "v",
      duration_sec: 5,
    }));
    expect(VideoPlanSchema.safeParse({ ...validPlan, segments: many }).success).toBe(false);
  });
});
