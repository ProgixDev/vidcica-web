import { beforeEach, describe, expect, it } from "vitest";
import { analyticsAllowed, readConsent, shouldAskConsent, writeConsent } from "./consent";

describe("analytics consent", () => {
  beforeEach(() => localStorage.clear());

  it("starts with no choice", () => {
    expect(readConsent()).toBeNull();
  });

  it("round-trips a choice", () => {
    writeConsent("granted");
    expect(readConsent()).toBe("granted");
    writeConsent("denied");
    expect(readConsent()).toBe("denied");
  });

  it("ignores a corrupted stored value", () => {
    localStorage.setItem("vidcica.analytics-consent", "maybe");
    expect(readConsent()).toBeNull();
  });

  it("only asks when analytics is configured and unanswered", () => {
    expect(shouldAskConsent(true, null)).toBe(true);
    // Nothing to consent to without a key — asking would be pure noise.
    expect(shouldAskConsent(false, null)).toBe(false);
    expect(shouldAskConsent(true, "denied")).toBe(false);
    expect(shouldAskConsent(true, "granted")).toBe(false);
  });

  it("runs only on an explicit yes", () => {
    expect(analyticsAllowed(true, "granted")).toBe(true);
    expect(analyticsAllowed(true, null)).toBe(false);
    expect(analyticsAllowed(true, "denied")).toBe(false);
    // A key alone is never enough.
    expect(analyticsAllowed(false, "granted")).toBe(false);
  });
});
