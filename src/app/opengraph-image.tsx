import { ImageResponse } from "next/og";
import { site } from "@/core/site";

/**
 * Open Graph card (1200×630) — rendered at request time by next/og. Brand
 * gradient + wordmark; raw hexes are sanctioned here (logo surface, see
 * globals.css). Referenced automatically via the file convention.
 */
export const alt = "Vidcica — studio vidéo IA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "linear-gradient(135deg, #0A0807 0%, #1A1613 55%, #2A1A12 100%)",
        color: "#FFFBF6",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 22,
            background: "linear-gradient(135deg, #C75A1A 0%, #FF8A3D 55%, #FFD9B0 100%)",
          }}
        />
        <div style={{ fontSize: 56, fontWeight: 700 }}>Vidcica</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.15, maxWidth: 980 }}>
          Un script devient une vidéo courte — publiée partout, automatiquement.
        </div>
        <div style={{ fontSize: 30, color: "#9C8E85" }}>{site.description}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 14, height: 14, borderRadius: 7, background: "#FF7A2E" }} />
        <div style={{ fontSize: 26, color: "#D6CCC2" }}>vidcica.com</div>
      </div>
    </div>,
    { ...size },
  );
}
