import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { LOCALE_HEADER, PATH_HEADER, splitLocalePath } from "@/lib/i18n/routing";

/**
 * Two jobs per request: refresh the Supabase session (gating protected routes)
 * and resolve the locale from the URL.
 *
 * French is served at the root and English under `/en`, so `/en/privacy` is
 * rewritten to `/privacy` with the locale passed down as a request header. The
 * route tree therefore holds one copy of every page, and the URL — not a cookie
 * — decides the language, which is what makes each language indexable.
 *
 * The matcher skips static assets and images for performance.
 */
export async function middleware(request: NextRequest) {
  const { locale, path, prefixed } = splitLocalePath(request.nextUrl.pathname);

  // Auth gating must see the real route, not the prefixed one, or `/en/dashboard`
  // would slip past the protected-prefix check.
  const response = await updateSession(request, { path, locale });

  // A redirect from the auth gate is already localized — don't rewrite it.
  if (response.headers.get("location")) return response;

  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  headers.set(PATH_HEADER, path);

  if (!prefixed) {
    // Root-served French: no URL change, just hand the locale + path down.
    const next = NextResponse.next({ request: { headers } });
    for (const cookie of response.cookies.getAll()) next.cookies.set(cookie);
    return next;
  }

  const url = request.nextUrl.clone();
  url.pathname = path;
  const rewritten = NextResponse.rewrite(url, { request: { headers } });
  // Carry the refreshed Supabase auth cookies onto the rewrite, or the session
  // silently stops refreshing on every English URL.
  for (const cookie of response.cookies.getAll()) rewritten.cookies.set(cookie);
  return rewritten;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
