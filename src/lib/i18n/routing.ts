/**
 * Locale routing — French lives at the root, English under `/en`.
 *
 * Why not `/fr` + `/en` symmetrically: `/privacy`, `/terms` and
 * `/supprimer-mon-compte` are registered with Google (OAuth verification),
 * TikTok, Meta and the Play Store listing. Moving them would break those
 * registrations, so the default locale keeps the bare paths and only English
 * gets a prefix.
 *
 * The prefix never reaches the route tree: middleware rewrites `/en/x` to `/x`
 * and passes the locale down as a request header, so there is exactly one copy
 * of every page.
 */
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";

/** Request headers middleware sets for the server components below it. */
export const LOCALE_HEADER = "x-vidcica-locale";
/** The path with any locale prefix removed — what canonical/hreflang build on. */
export const PATH_HEADER = "x-vidcica-path";

/** Paths that must never be localized: OAuth/email callbacks whose URLs are
 *  registered in Supabase, Google, Meta and TikTok consoles, plus machine
 *  endpoints. A locale prefix here would 404 a live redirect. */
const UNLOCALIZED = [
  "/auth",
  "/oauth",
  "/api",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
];

export function isUnlocalizedPath(pathname: string): boolean {
  return UNLOCALIZED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Split `/en/privacy` into its locale and the path the app should render.
 * An unprefixed path is the default locale, and `/en` alone is the home page.
 */
export function splitLocalePath(pathname: string): {
  locale: Locale;
  path: string;
  prefixed: boolean;
} {
  const segments = pathname.split("/").filter(Boolean);
  const [first, ...rest] = segments;
  if (isLocale(first) && first !== DEFAULT_LOCALE) {
    return { locale: first, path: `/${rest.join("/")}`, prefixed: true };
  }
  return { locale: DEFAULT_LOCALE, path: pathname || "/", prefixed: false };
}

/**
 * The URL a given path takes in a given locale — the inverse of
 * `splitLocalePath`. Feed it an already-stripped path.
 */
export function localizedPath(path: string, locale: Locale): string {
  const clean = path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE || isUnlocalizedPath(clean)) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/**
 * Pages that already carry both languages in one document (`#fr` / `#en`
 * anchors) — the legal texts. Google's OAuth review and the Play Store data
 * URL point at these exact paths and expect to find the English text there, so
 * they stay one URL: an `/en` twin would be the same bytes under a second
 * address, which is duplicate content rather than a translation.
 */
const BILINGUAL_DOCUMENTS = ["/privacy", "/terms"];

export function isBilingualDocumentPath(pathname: string): boolean {
  return BILINGUAL_DOCUMENTS.includes(pathname);
}

/** Locale from a header value, falling back to French. */
export function localeFromHeader(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
