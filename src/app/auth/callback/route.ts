import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/redirect";

/**
 * OAuth redirect target (Google + Apple — the same Supabase providers the
 * mobile app uses). Supabase sends the user back here with a PKCE `code`;
 * exchanging it writes the session cookies, then we forward to the requested
 * page.
 *
 * NOTE: this URL must be allow-listed in Supabase → Authentication → URL
 * Configuration → Redirect URLs (localhost + vidcica.com variants).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeRedirectPath(url.searchParams.get("next"), "/dashboard");
  // Which button the user pressed — untrusted, so narrow it to the known set.
  const provider = url.searchParams.get("provider") === "apple" ? "apple" : "google";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  // No code or a failed exchange (expired/consumed code, misconfigured
  // allow-list, provider not enabled in Supabase…) — land back on sign-in with
  // a flag the panel can surface, naming the provider that failed.
  const fallback = new URL("/sign-in", url.origin);
  fallback.searchParams.set("error", "oauth");
  fallback.searchParams.set("provider", provider);
  return NextResponse.redirect(fallback);
}
