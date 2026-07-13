import { describe, expect, it } from "vitest";
import { isUpgrade, ORDERED_TIERS, planRank, TIERS } from "./tiers";

describe("tier matrix (AC-2)", () => {
  it("has the canonical prices and monthly credits", () => {
    expect(TIERS.free.priceEUR).toBe(0);
    expect(TIERS.starter.priceEUR).toBe(25);
    expect(TIERS.pro.priceEUR).toBe(45);
    expect(TIERS.studio.priceEUR).toBe(99);
    expect(
      [TIERS.free, TIERS.starter, TIERS.pro, TIERS.studio].map((t) => t.monthlyCredits),
    ).toEqual([20, 150, 300, 600]);
  });

  it("orders free < starter < pro < studio", () => {
    expect(ORDERED_TIERS).toEqual(["free", "starter", "pro", "studio"]);
    expect(planRank("free")).toBeLessThan(planRank("studio"));
  });

  it("isUpgrade only for a higher paid tier", () => {
    expect(isUpgrade("free", "starter")).toBe(true);
    expect(isUpgrade("pro", "studio")).toBe(true);
    expect(isUpgrade("pro", "starter")).toBe(false); // downgrade
    expect(isUpgrade("free", "free")).toBe(false); // same / not paid
    expect(isUpgrade("studio", "studio")).toBe(false);
  });
});
