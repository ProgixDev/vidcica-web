import { describe, expect, it } from "vitest";
import { draftPrefill } from "./draft";

const base = { title: "Boost your reviews", script: "", format: "9:16", durationSec: 30 };

describe("draftPrefill", () => {
  it("continues a draft from its own script, planned verbatim", () => {
    const prefill = draftPrefill({
      ...base,
      script: "  Want better reviews? Ask right after the sale.  ",
    });
    expect(prefill.kind).toBe("script");
    expect(prefill.prompt).toBe("Want better reviews? Ask right after the sale.");
  });

  it("falls back to the title as the idea when the draft has no script", () => {
    expect(draftPrefill(base)).toMatchObject({ kind: "idea", prompt: "Boost your reviews" });
  });

  it("keeps the draft’s ratio and snaps its length to one the composer offers", () => {
    expect(draftPrefill({ ...base, format: "1:1", durationSec: 20 })).toMatchObject({
      ratio: "1:1",
      length: 15,
    });
    expect(draftPrefill({ ...base, durationSec: 45 }).length).toBe(30);
  });

  it("drops a ratio the composer does not offer", () => {
    expect(draftPrefill({ ...base, format: "4:5" }).ratio).toBeUndefined();
  });
});
