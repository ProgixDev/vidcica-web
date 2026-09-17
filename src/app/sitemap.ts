import type { MetadataRoute } from "next";
import { site } from "@/core/site";
import { isBilingualDocumentPath, localizedPath } from "@/lib/i18n/routing";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n/config";
import { listUseCasePaths } from "@/lib/marketing/use-cases";

/** Add a row per public, indexable route. Keep auth/account/api out. */
const ROUTES = [
  "/",
  "/fonctionnalites",
  "/tarifs",
  "/faq",
  "/cas-usage",
  ...listUseCasePaths(),
  "/sign-in",
  "/privacy",
  "/terms",
  "/mentions-legales",
  "/supprimer-mon-compte",
];

/**
 * One entry per route per language, each pointing at its siblings through
 * `alternates.languages` — the sitemap half of the hreflang contract the root
 * layout emits in `<head>`. French sits at the root, English under /en.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.flatMap((route) =>
    (isBilingualDocumentPath(route) ? ([DEFAULT_LOCALE] as const) : LOCALES).map((locale) => ({
      url: `${site.url}${localizedPath(route, locale)}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: route === "/" ? 1 : 0.6,
      ...(isBilingualDocumentPath(route)
        ? {}
        : {
            alternates: {
              languages: Object.fromEntries(
                LOCALES.map((l) => [l, `${site.url}${localizedPath(route, l)}`]),
              ),
            },
          }),
    })),
  );
}
