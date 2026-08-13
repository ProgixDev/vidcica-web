/**
 * Central site config — the single source for metadata, robots, sitemap, and
 * manifest. Replace name/description and set NEXT_PUBLIC_SITE_URL per app (it
 * drives canonical + Open Graph URLs).
 */
export const site = {
  name: "Vidcica",
  shortName: "Vidcica",
  description:
    "Générez des vidéos courtes par IA et publiez-les automatiquement sur vos réseaux sociaux.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
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
