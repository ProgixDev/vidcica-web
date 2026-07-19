import type { MetadataRoute } from "next";
import { site } from "@/core/site";

/** Add a row per public, indexable route. Keep auth/account/api out. */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/sign-in",
    "/privacy",
    "/terms",
    "/mentions-legales",
    "/supprimer-mon-compte",
  ];
  return routes.map((path) => ({
    url: `${site.url}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }));
}
