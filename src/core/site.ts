/**
 * Central site config — the single source for metadata, robots, sitemap, and
 * manifest. Replace name/description and set NEXT_PUBLIC_SITE_URL per app (it
 * drives canonical + Open Graph URLs).
 */
/**
 * The host Vercel serves without redirecting. `vidcica.com` 308s to
 * `www.vidcica.com`, so canonical URLs, the sitemap and robots must all name
 * **www** — a self-referencing canonical that points at a redirect wastes crawl
 * budget and muddies which URL Google consolidates on.
 *
 * If the redirect is ever flipped (www → apex), change this one constant.
 */
const CANONICAL_HOST = "www.vidcica.com";

/** Normalise the configured origin onto the canonical host + no trailing slash. */
export function canonicalOrigin(raw: string): string {
  const trimmed = raw.replace(/\/+$/, "");
  try {
    const url = new URL(trimmed);
    if (url.hostname === "vidcica.com") url.hostname = CANONICAL_HOST;
    return url.origin;
  } catch {
    return trimmed; // not a URL (misconfigured env) — leave it visible rather than crash
  }
}

export const site = {
  name: "Vidcica",
  shortName: "Vidcica",
  description:
    "Générez des vidéos courtes par IA et publiez-les automatiquement sur vos réseaux sociaux.",
  url: canonicalOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  locale: "fr_FR",
} as const;

/**
 * Only the production deploy should be crawlable. Vercel sets `VERCEL_ENV` to
 * "production" for the prod deploy and "preview" for every preview/branch build;
 * anything else (preview, local) → noindex, so Google never indexes a test URL.
 * Used server-side by the robots metadata + robots.ts. (Server-only env var —
 * evaluates to false in any client bundle, where it's unused.)
 */
export const isIndexableDeploy = process.env.VERCEL_ENV === "production";
