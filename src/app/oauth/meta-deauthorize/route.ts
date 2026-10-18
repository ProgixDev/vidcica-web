import { NextResponse, type NextRequest } from "next/server";
import { clientEnv } from "@/core/env.client";

/**
 * Meta's "Deauthorize callback URL", on a domain we own.
 *
 * Meta POSTs here (form body `signed_request=<signature>.<payload>`) when a
 * person removes Vidcica from their Facebook settings. We forward the body
 * untouched to the `meta-deauthorize` Edge Function, server-to-server, and
 * mirror its answer. The function checks the signature (HMAC-SHA256 with the
 * app secret) and does the work: disconnects the Meta rows, marks running
 * Boosts, notifies the person.
 *
 * Nothing secret lives here and nothing is trusted here: a forged body fails
 * the signature check in the function exactly as if it had been sent there
 * directly. Same reason as /oauth/callback for existing at all: every URL in
 * the Meta app config sits on vidcica.com, which we can verify, rather than on
 * supabase.co.
 *
 * Registered in the Facebook Login for Business settings as
 * https://www.vidcica.com/oauth/meta-deauthorize. Keep the `www`: the bare
 * domain 308-redirects, and a POST callback is not expected to follow it.
 *
 * Deliberately public: `/oauth` is not in the middleware's PROTECTED_PREFIXES.
 */

export const dynamic = "force-dynamic";

/** A signed_request is a few hundred bytes; anything far larger isn't Meta. */
const MAX_BODY_BYTES = 16 * 1024;

export async function POST(request: NextRequest) {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }
  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  const target = new URL("/functions/v1/meta-deauthorize", clientEnv.NEXT_PUBLIC_SUPABASE_URL);
  let res: Response;
  try {
    res = await fetch(target, {
      method: "POST",
      // Only the body and its type travel on: no cookies, no client headers.
      headers: {
        "content-type": request.headers.get("content-type") ?? "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }

  // Mirror the function's answer (200 ok, 400 invalid_signature…) so Meta sees
  // the real outcome and failures stay diagnosable.
  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}
