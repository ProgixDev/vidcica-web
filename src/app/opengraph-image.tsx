import { ImageResponse } from "next/og";

/**
 * Open Graph card (1200×630) — rendered by next/og (prerendered at build).
 * Identity 01: the flat two-stroke mark, the tagline, and the “contre-jour”
 * field as atmosphere. Raw hexes are sanctioned here (brand surface — next/og
 * cannot read CSS variables; values come from identity.tokens.json).
 */
export const alt = "Vidcica — Une idée. Une vidéo. Publiée.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background:
          "linear-gradient(35deg, #111210 0%, #111210 30%, #343C35 62%, #9C987B 90%, #D6CFAC 100%)",
        color: "#F5F5EE",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <svg width="56" height="56" viewBox="0 0 96 96">
          <path fill="#F5F5EE" d="M0 16H24L40 64L28 96Z M72 0H96L64 96H40Z" />
        </svg>
        <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1.5 }}>Vidcica</div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 92,
          fontWeight: 600,
          lineHeight: 1.05,
          letterSpacing: -3.6,
          maxWidth: 900,
        }}
      >
        Une idée. Une vidéo. Publiée.
      </div>
      <div style={{ display: "flex", fontSize: 28, color: "#B8BBAF" }}>vidcica.com</div>
    </div>,
    { ...size },
  );
}
