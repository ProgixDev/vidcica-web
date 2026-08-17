import { NextResponse, type NextRequest } from "next/server";
import { clientEnv } from "@/core/env.client";

/**
 * OAuth callback on a domain we actually OWN.
 *
 * Providers (Google, Meta, TikTok, LinkedIn, Threads) send the creator's browser
 * here after they approve the consent screen. We forward the query string to the
 * `oauth-callback` Edge Function server-to-server, then send the browser wherever
 * that function says to go.
 *
 * WHY THIS EXISTS: the redirect URI registered in every provider console used to
 * be `https://<project-ref>.supabase.co/functions/v1/oauth-callback`. Platform
 * reviewers (Google OAuth verification, TikTok URL properties) require proof of
 * ownership for every URL in the app config, and `supabase.co` is a domain we can
 * never DNS-verify. This route moves that URL onto vidcica.com while keeping every
 * secret where it already was — the code-for-token exchange still happens inside
 * the Edge Function, the only place the client secrets exist. Nothing sensitive
 * moves into the Next.js app.
 *
 * SECURITY: we pass the Edge Function's `Location` through verbatim. That is safe
 * because the function already guards it with the `WEB_RETURN_ORIGINS` allowlist
 * (`redirect_after` is client-supplied, so an unchecked value would be a textbook
 * open redirect). We deliberately do NOT add our own allowlist here — one guard,
 * one place. If that guard ever moves, this comment is wrong; check it.
 *
 * Deliberately public: `/oauth` is not in the middleware's PROTECTED_PREFIXES.
 * Gating it would bounce the popup to /sign-in mid-flow and break every connect.
 */

// The provider appends ?code=…&state=… — this must never be cached or statically
// rendered.
export const dynamic = "force-dynamic";

/** Where to land the popup when we cannot reach the Edge Function at all. */
function failure(request: NextRequest) {
  // `ok=0` is the contract /oauth/connected already reads (ok !== "0").
  const url = new URL("/oauth/connected", request.nextUrl.origin);
  url.searchParams.set("ok", "0");
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const target = new URL("/functions/v1/oauth-callback", clientEnv.NEXT_PUBLIC_SUPABASE_URL);
  // Forward the provider's params untouched — `state` is what the Edge Function
  // uses to resolve the platform and the originating user, and it validates it
  // against the `oauth_states` row. We add nothing and strip nothing.
  target.search = request.nextUrl.search;

  let res: Response;
  try {
    // `redirect: "manual"` — we want the 302 itself, not to follow it here. The
    // browser must perform the final hop so cookies and custom schemes work.
    res = await fetch(target, { redirect: "manual", cache: "no-store" });
  } catch {
    return failure(request);
  }

  const location = res.headers.get("location");
  if (location) {
    // Built by hand rather than with NextResponse.redirect(): mobile connects come
    // back as `vidcica://…`, and redirect() only accepts an http(s) URL.
    return new NextResponse(null, { status: 302, headers: { location } });
  }

  // No Location means the function answered directly — an error body. Mirror it
  // instead of inventing a status, so failures stay diagnosable.
  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "text/plain" },
  });
}
