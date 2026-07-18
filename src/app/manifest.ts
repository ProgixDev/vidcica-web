import type { MetadataRoute } from "next";
import { site } from "@/core/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.shortName,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#FFFBF6",
    theme_color: "#FF7A2E",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
