import type { TFunction } from "@/lib/i18n";

export type HeatmapCell = {
  weekday: number; // 0=Mon .. 6=Sun
  hour: number; // 0..23
  intensity: number; // 0..1
};

const BUCKETS = [0, 4, 8, 12, 16, 20];

/**
 * 7×6 activity heatmap (4-hour buckets). Cell opacity encodes intensity over the
 * brand token. With no cells (no collection yet) it renders the full grid at
 * minimum opacity — an honest empty shell, not fabricated peaks.
 */
export function HeatmapHours({ t, cells }: { t: TFunction; cells: ReadonlyArray<HeatmapCell> }) {
  // "L,M,M,J,V,S,D" (fr) / "M,T,W,T,F,S,S" (en) — one key, split per locale.
  const dayLabels = t("analytics.audience.hours.dayLabels").split(",");

  const sum: number[][] = Array.from({ length: 7 }, () => BUCKETS.map(() => 0));
  const count: number[][] = Array.from({ length: 7 }, () => BUCKETS.map(() => 0));
  for (const c of cells) {
    if (c.weekday < 0 || c.weekday > 6) continue;
    const b = Math.min(BUCKETS.length - 1, Math.floor(c.hour / 4));
    sum[c.weekday]![b]! += c.intensity;
    count[c.weekday]![b]! += 1;
  }

  return (
    <div className="flex flex-col gap-1.5" data-testid="analytics-heatmap">
      <div className="flex gap-1.5 pl-7">
        {BUCKETS.map((b) => (
          <div key={b} className="text-muted-foreground flex-1 text-center text-[9px]">
            {t("analytics.audience.hours.hourFmt", { h: b })}
          </div>
        ))}
      </div>
      {Array.from({ length: 7 }, (_, d) => (
        <div key={d} className="flex items-center gap-1.5">
          <div className="text-muted-foreground w-5 text-[10px]">{dayLabels[d] ?? ""}</div>
          {BUCKETS.map((_, b) => {
            const c = count[d]![b]!;
            const v = c > 0 ? sum[d]![b]! / c : 0;
            return (
              <div
                key={b}
                className="bg-primary border-border/60 h-5 flex-1 rounded-md border"
                style={{ opacity: Math.max(0.06, v) }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
