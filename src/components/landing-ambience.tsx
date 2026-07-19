/**
 * Landing depth layer — soft warm blooms distributed down the page plus a fine
 * film grain, so sections sit on a living, brand-warm backdrop instead of flat
 * white. Purely decorative (aria-hidden, pointer-events-none); rendered as the
 * first child of a `relative` container so content paints above it, and clipped
 * so the blur never causes horizontal scroll. Theme-aware via `var(--primary)`.
 */

// Grayscale fractal noise (no color literals) → premium film-grain texture.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const BLOOMS: { top: string; side: "left" | "right"; size: number; opacity: number }[] = [
  { top: "2%", side: "left", size: 560, opacity: 0.16 },
  { top: "24%", side: "right", size: 620, opacity: 0.12 },
  { top: "50%", side: "left", size: 560, opacity: 0.1 },
  { top: "72%", side: "right", size: 600, opacity: 0.12 },
  { top: "92%", side: "left", size: 520, opacity: 0.1 },
];

export function LandingAmbience() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {BLOOMS.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-[120px]"
          style={{
            top: b.top,
            [b.side]: "-8%",
            height: b.size,
            width: b.size,
            opacity: b.opacity,
            background: "radial-gradient(closest-side, var(--primary), transparent 70%)",
          }}
        />
      ))}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-soft-light dark:opacity-[0.06]"
        style={{ backgroundImage: GRAIN, backgroundSize: "140px 140px" }}
      />
    </div>
  );
}
