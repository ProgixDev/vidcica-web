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
      className="text-primary overflow-visible"
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
    <div
      className="border-primary/25 bg-primary/5 rounded-2xl border p-5"
      data-testid="analytics-hero"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-muted-foreground text-[11px] font-medium">
            {t("analytics.hero.totalViews", { days })}
          </span>
          <span className="text-primary text-4xl leading-none font-semibold tracking-tight">
            {value}
          </span>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={trendUp ? "text-success" : "text-destructive"} aria-hidden>
              {trendUp ? "▲" : "▼"}
            </span>
            <span className={cnDelta(trendUp)}>
              {trendUp ? "+" : ""}
              {delta.toFixed(1)} %
            </span>
            <span className="text-muted-foreground text-[11px]">
              {t("analytics.hero.deltaVsPrev")}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Sparkline data={series} />
          <Badge variant="brand">
            {t("analytics.hero.publications", { count: publishedCount })}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function cnDelta(up: boolean): string {
  return `text-xs font-semibold ${up ? "text-success" : "text-destructive"}`;
}
