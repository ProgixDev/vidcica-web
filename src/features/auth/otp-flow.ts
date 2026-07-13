/**
 * Pure state machine for the phone-OTP sign-in flow. Kept framework-free so the
 * form's behavior (request code → enter code → verify, plus error handling) is
 * unit-testable without React or a live SMS round-trip (spec AC-2, AC-4).
 */
export type OtpState = {
  step: "phone" | "code";
  phone: string;
  pending: boolean;
  error: string | null;
};

export type OtpAction =
  | { type: "requestStart"; phone: string }
  | { type: "requestOk" }
  | { type: "requestErr"; message: string }
  | { type: "verifyStart" }
  | { type: "verifyErr"; message: string }
  | { type: "editPhone" };

export const initialOtpState: OtpState = {
  step: "phone",
  phone: "",
  pending: false,
  error: null,
};

export function otpReducer(state: OtpState, action: OtpAction): OtpState {
  switch (action.type) {
    case "requestStart":
      return { ...state, phone: action.phone, pending: true, error: null };
    case "requestOk":
      // Code sent → advance to the code step.
      return { ...state, step: "code", pending: false, error: null };
    case "requestErr":
      return { ...state, pending: false, error: action.message };
    case "verifyStart":
      return { ...state, pending: true, error: null };
    case "verifyErr":
      // Stay on the code step so the user can retry; surface the error.
      return { ...state, pending: false, error: action.message };
    case "editPhone":
      return { ...state, step: "phone", pending: false, error: null };
    default:
      return state;
  }
}
