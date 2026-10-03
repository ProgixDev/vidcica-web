import { Badge } from "@/components/ui/badge";
import type { TFunction } from "@/lib/i18n";

export type AnalyticsHeroProps = {
  t: TFunction;
  /** Big headline number (already formatted). */
  value: string;
  /** Cur-vs-prev delta in percent (0 until a time-series exists). */
  delta: number;
  /** Series powering the inline sparkline; empty ⇒ flat honest baseline. */
  series: ReadonlyArray<number>;
  /** Published-item count surfaced as a badge. */
  publishedCount: number;
  days: number;
};

/** Inline SVG sparkline — pure, token-coloured (stroke = currentColor). Renders a
 *  flat baseline when there's no series yet (honest, not a fake trend). */
function Sparkline({ data }: { data: ReadonlyArray<number> }) {
  const W = 120;
  const H = 44;
  const pad = 3;
  const pts =
    data.length >= 2
      ? data
      : // flat baseline across the width when no data has been collected
        [0, 0];
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const step = (W - pad * 2) / (pts.length - 1);
  const coords = pts.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (H - pad * 2) * (1 - (v - min) / span);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="text-foreground overflow-visible"
      aria-hidden
    >
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={data.length >= 2 ? 1 : 0.3}
      />
    </svg>
  );
}

/**
 * The "Vues totales" hero — big number, inline sparkline, delta vs previous
 * period. Views stay 0 until reach collection lands; the delta/sparkline are the
 * seam for that data, shown honestly flat for now.
 */
export function AnalyticsHero({
  t,
  value,
  delta,
  series,
  publishedCount,
  days,
}: AnalyticsHeroProps) {
  const trendUp = delta >= 0;
  return (
    <div className="flex flex-wrap items-end justify-between gap-6" data-testid="analytics-hero">
      <div className="flex min-w-0 flex-col gap-3">
        <span className="text-muted-foreground text-[13px]">
          {t("analytics.hero.totalViews", { days })}
        </span>
        <span className="text-5xl leading-none font-semibold tracking-[-0.04em] tabular-nums sm:text-6xl">
          {value}
        </span>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
          <span className={cnDelta(delta)}>
            {delta !== 0 ? <span aria-hidden>{trendUp ? "▲ " : "▼ "}</span> : null}
            {trendUp ? "+" : ""}
            {delta.toFixed(1)} %
          </span>
          <span className="text-muted-foreground">{t("analytics.hero.deltaVsPrev")}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-3">
        <Sparkline data={series} />
        <Badge variant="muted">{t("analytics.hero.publications", { count: publishedCount })}</Badge>
      </div>
    </div>
  );
}

/** Status colour only for a real movement; a flat 0 % stays neutral. */
function cnDelta(delta: number): string {
  const tone = { up: "text-success", down: "text-destructive", flat: "text-muted-foreground" };
  const direction = Math.sign(delta) === 1 ? "up" : Math.sign(delta) === -1 ? "down" : "flat";
  return `font-semibold tabular-nums ${tone[direction]}`;
}
