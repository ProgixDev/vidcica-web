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
    // Real, stable public/ assets (the old "/icon.png" 404'd — Next serves
    // src/app/icon.png at a hashed route, not that path). The 512 covers every
    // smaller size (browsers downscale); the padded SVG is the Android adaptive
    // (maskable) icon. iOS uses src/app/apple-icon.png for Add-to-Home-Screen.
    icons: [
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
