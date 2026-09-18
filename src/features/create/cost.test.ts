import { describe, expect, it } from "vitest";
import { estimateCost, renderCostCredits } from "./cost";

describe("estimateCost", () => {
  it("makes stock renders free and affordable with an empty balance", () => {
    // Stock footage costs nothing (migration 20260918120000_free_stock_renders).
    // A price above 0 here blocked every free account, since none hold credits.
    expect(renderCostCredits("pexels", 30)).toBe(0);
    expect(estimateCost("pexels", 30, 0)).toMatchObject({ total: 0, affordable: true });
  });

  it("still bills AI footage per second", () => {
    expect(renderCostCredits("kling", 30)).toBeGreaterThan(0);
    expect(estimateCost("kling", 30, 0).affordable).toBe(false);
  });
});
