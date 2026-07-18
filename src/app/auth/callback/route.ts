import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/redirect";

/**
 * OAuth redirect target (Google — same Supabase provider the mobile app uses).
 * Supabase sends the user back here with a PKCE `code`; exchanging it writes
 * the session cookies, then we forward to the requested page.
 *
 * NOTE: this URL must be allow-listed in Supabase → Authentication → URL
 * Configuration → Redirect URLs (localhost + vidcica.com variants).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeRedirectPath(url.searchParams.get("next"), "/dashboard");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  // No code or a failed exchange (expired/consumed code, misconfigured
  // allow-list…) — land back on sign-in with a flag the panel can surface.
  const fallback = new URL("/sign-in", url.origin);
  fallback.searchParams.set("error", "oauth");
  return NextResponse.redirect(fallback);
}
