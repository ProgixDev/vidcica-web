import type { MetadataRoute } from "next";
import { site, isIndexableDeploy } from "@/core/site";

export default function robots(): MetadataRoute.Robots {
  // Preview/branch deploys: disallow everything so no test URL is crawled.
  if (!isIndexableDeploy) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/account", "/api/"] },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
