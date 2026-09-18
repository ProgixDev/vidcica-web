import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { confirmDestination, parseConfirmType } from "@/features/auth";

/**
 * Target of the "Confirm signup" email (see features/auth/confirm.ts). Redeems
 * the token hash, which writes the session cookies, then routes the user.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = parseConfirmType(url.searchParams.get("type"));
  const redirectTo = url.searchParams.get("redirect_to");

  let ok = false;
  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }

  return NextResponse.redirect(new URL(confirmDestination({ ok, redirectTo }), url.origin));
}
