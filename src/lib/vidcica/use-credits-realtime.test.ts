import { describe, expect, it } from "vitest";
import { nextBalance } from "./use-credits-realtime";

describe("nextBalance (AC-7 credits merge)", () => {
  it("takes the new balance when present", () => {
    expect(nextBalance(100, { balance: 88 })).toBe(88);
    expect(nextBalance(100, { balance: 0 })).toBe(0);
  });
  it("keeps the current balance when the payload has none", () => {
    expect(nextBalance(100, {})).toBe(100);
    expect(nextBalance(100, { balance: null })).toBe(100);
  });
});
