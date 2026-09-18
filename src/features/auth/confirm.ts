import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Email confirmation by token hash. The "Confirm signup" email links to
 * `/auth/confirm?token_hash=…&type=email&redirect_to={{ .RedirectTo }}`.
 *
 * Why not Supabase's default `{{ .ConfirmationURL }}`: that returns a PKCE
 * code which only the device that signed up can redeem, and only within
 * 5 minutes (the flow state expires). People open the email later, or on
 * another device, and landed signed out with no explanation. A token hash is
 * redeemed directly with verifyOtp: no stored verifier, and it lives as long
 * as the email link (Supabase "Email OTP expiration").
 *
 * On Android with v16+, `/auth/confirm` is a verified App Link, so the app
 * opens and redeems the token itself. This route is the fallback everywhere
 * else: desktop, iPhone, older app versions, and web sign-ups.
 */

/** The only email OTP types this route accepts. */
const CONFIRM_TYPES: readonly EmailOtpType[] = ["email", "signup"];

export function parseConfirmType(raw: string | null): EmailOtpType | null {
  return CONFIRM_TYPES.find((type) => type === raw) ?? null;
}

/** Sign-ups from the app pass the app's deep link as their redirect. */
export function isAppSignup(redirectTo: string | null): boolean {
  return (redirectTo ?? "").startsWith("vidcica://");
}

/**
 * Where to send the user after the confirmation attempt. A web sign-up is now
 * signed in here and goes straight to work; an app sign-up is told to go back
 * to the app, since the session lives in this browser, not on the phone.
 */
export function confirmDestination(opts: { ok: boolean; redirectTo: string | null }): string {
  if (!opts.ok) return "/auth/confirmed?status=invalid";
  return isAppSignup(opts.redirectTo) ? "/auth/confirmed?status=ok" : "/dashboard";
}
