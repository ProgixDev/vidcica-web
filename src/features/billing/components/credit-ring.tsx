/**
 * Circular credit gauge — a hand-built SVG ring whose fill encodes how much of
 * the monthly allotment remains. Ported from ClipFlow app/billing/credits.tsx
 * (`CreditRing`) to SVG + tokens. Pure/presentational (no client runtime).
 */
type CreditRingProps = {
  /** 0–1 fraction of the allotment remaining. */
  progress: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
};

export function CreditRing({ progress, size = 96, stroke = 9, children }: CreditRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  const center = size / 2;
  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0" aria-hidden>
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-border"
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          transform={`rotate(-90 ${center} ${center})`}
          className="stroke-primary transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="relative flex flex-col items-center">{children}</div>
    </div>
  );
}
