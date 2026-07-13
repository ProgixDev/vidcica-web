import { describe, expect, it } from "vitest";
import { mapEnqueueReason } from "./generation";

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
  });

  it("falls back to 'error' for unknown / undefined", () => {
    expect(mapEnqueueReason(undefined)).toBe("error");
    expect(mapEnqueueReason("some_new_code")).toBe("error");
  });
});
