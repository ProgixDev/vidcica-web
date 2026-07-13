import { describe, expect, it } from "vitest";
import { initialOtpState, otpReducer, type OtpState } from "./otp-flow";
import { OtpSchema, PhoneSchema } from "./schema";

describe("otpReducer (AC-2 flow, AC-4 errors)", () => {
  it("request → sent advances to the code step", () => {
    let s = otpReducer(initialOtpState, { type: "requestStart", phone: "+33612345678" });
    expect(s).toMatchObject({ step: "phone", pending: true, phone: "+33612345678" });
    s = otpReducer(s, { type: "requestOk" });
    expect(s).toMatchObject({ step: "code", pending: false, error: null });
  });

  it("request error stays on phone step with a message (AC-4)", () => {
    let s = otpReducer(initialOtpState, { type: "requestStart", phone: "+33612345678" });
    s = otpReducer(s, { type: "requestErr", message: "SMS failed" });
    expect(s).toMatchObject({ step: "phone", pending: false, error: "SMS failed" });
  });

  it("verify error stays on the code step so the user can retry (AC-4)", () => {
    let s: OtpState = { ...initialOtpState, step: "code" };
    s = otpReducer(s, { type: "verifyStart" });
    expect(s.pending).toBe(true);
    s = otpReducer(s, { type: "verifyErr", message: "Invalid code" });
    expect(s).toMatchObject({ step: "code", pending: false, error: "Invalid code" });
  });

  it("editPhone returns to the phone step", () => {
    const s = otpReducer({ ...initialOtpState, step: "code" }, { type: "editPhone" });
    expect(s.step).toBe("phone");
  });
});

describe("phone + otp validation", () => {
  it("accepts E.164, rejects malformed", () => {
    expect(PhoneSchema.safeParse({ phone: "+33612345678" }).success).toBe(true);
    expect(PhoneSchema.safeParse({ phone: "0612345678" }).success).toBe(false);
    expect(PhoneSchema.safeParse({ phone: "abc" }).success).toBe(false);
  });
  it("accepts a 6-digit code only", () => {
    expect(OtpSchema.safeParse({ code: "123456" }).success).toBe(true);
    expect(OtpSchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(OtpSchema.safeParse({ code: "12345a" }).success).toBe(false);
  });
});
