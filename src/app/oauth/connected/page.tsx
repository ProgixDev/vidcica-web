import type { Metadata } from "next";
import { OAuthConnectedView } from "./view";

export const metadata: Metadata = {
  title: "Compte connecté",
  // A popup landing page, never a destination — keep it out of search results.
  robots: { index: false, follow: false },
};

/**
 * OAuth return page — where `oauth-callback` bounces the popup after storing the
 * token (see `redirect_after` in lib/vidcica/oauth.ts).
 *
 * Deliberately OUTSIDE the `(app)` group: this renders in a 600×720 popup, so it
 * gets the bare root layout rather than the sidebar/bell/assistant chrome. It is
 * also intentionally public (not in the middleware's PROTECTED_PREFIXES) — it
 * displays no user data, and gating it would risk bouncing the popup to
 * /sign-in mid-flow. The real connection state is read from the `networks` row
 * by the opener, never from this page's query params.
 */
export default async function OAuthConnectedPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; platform?: string }>;
}) {
  const { ok } = await searchParams;
  return <OAuthConnectedView ok={ok !== "0"} />;
}
