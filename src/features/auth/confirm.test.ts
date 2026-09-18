import { describe, expect, it } from "vitest";
import { confirmDestination, isAppSignup, parseConfirmType } from "./confirm";

describe("parseConfirmType", () => {
  it("accepts only confirmation types", () => {
    expect(parseConfirmType("email")).toBe("email");
    expect(parseConfirmType("signup")).toBe("signup");
    // A recovery or email-change token must not be redeemable through the
    // sign-up confirmation route.
    expect(parseConfirmType("recovery")).toBeNull();
    expect(parseConfirmType("email_change")).toBeNull();
    expect(parseConfirmType(null)).toBeNull();
  });
});

describe("confirmDestination", () => {
  it("tells app sign-ups to go back to the app", () => {
    expect(isAppSignup("vidcica://auth/callback")).toBe(true);
    expect(confirmDestination({ ok: true, redirectTo: "vidcica://auth/callback" })).toBe(
      "/auth/confirmed?status=ok",
    );
  });

  it("sends web sign-ups straight to the dashboard", () => {
    expect(confirmDestination({ ok: true, redirectTo: "https://www.vidcica.com" })).toBe(
      "/dashboard",
    );
    expect(confirmDestination({ ok: true, redirectTo: null })).toBe("/dashboard");
  });

  it("explains an expired or reused link whatever the origin", () => {
    expect(confirmDestination({ ok: false, redirectTo: "vidcica://auth/callback" })).toBe(
      "/auth/confirmed?status=invalid",
    );
    expect(confirmDestination({ ok: false, redirectTo: null })).toBe(
      "/auth/confirmed?status=invalid",
    );
  });
});
