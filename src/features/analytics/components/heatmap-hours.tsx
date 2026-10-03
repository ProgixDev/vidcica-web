import type { TFunction } from "@/lib/i18n";

export type HeatmapCell = {
  weekday: number; // 0=Mon .. 6=Sun
  hour: number; // 0..23
  intensity: number; // 0..1
};

const BUCKETS = [0, 4, 8, 12, 16, 20];

/**
 * 7×6 activity heatmap (4-hour buckets). Cell opacity encodes intensity over the
 * ink (`foreground`) token. With no cells (no collection yet) it renders the full grid at
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
    <div className="flex flex-col gap-2" data-testid="analytics-heatmap">
      <div className="flex gap-2 pl-8">
        {BUCKETS.map((b) => (
          <div key={b} className="text-muted-foreground flex-1 text-center text-xs">
            {t("analytics.audience.hours.hourFmt", { h: b })}
          </div>
        ))}
      </div>
      {Array.from({ length: 7 }, (_, d) => (
        <div key={d} className="flex items-center gap-2">
          <div className="text-muted-foreground w-6 text-xs">{dayLabels[d] ?? ""}</div>
          {BUCKETS.map((_, b) => {
            const c = count[d]![b]!;
            const v = c > 0 ? sum[d]![b]! / c : 0;
            return (
              <div
                key={b}
                className="bg-foreground h-7 flex-1 rounded-sm"
                style={{ opacity: Math.max(0.08, v) }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
