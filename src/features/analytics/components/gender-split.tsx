import type { TFunction } from "@/lib/i18n";

export type GenderSplitProps = {
  t: TFunction;
  female: number; // 0..1
  male: number;
  other?: number;
};

/**
 * Stacked horizontal bar (female / male / other) + legend. When every share is 0
 * (no collection yet) it renders a neutral empty bar and "—" legend values —
 * honest, never fabricated. Token colours only.
 */
export function GenderSplit({ t, female, male, other = 0 }: GenderSplitProps) {
  const sum = female + male + other;
  const has = sum > 0;
  const total = sum || 1;
  const fp = female / total;
  const mp = male / total;
  const op = other / total;
  const pct = (v: number) => (has ? `${Math.round(v * 100)} %` : "—");

  return (
    <div className="flex flex-col gap-3" data-testid="analytics-gender-split">
      <div className="bg-muted flex h-3.5 overflow-hidden rounded-full">
        {has ? (
          <>
            <div className="bg-primary h-full" style={{ width: `${fp * 100}%` }} />
            <div className="bg-primary/50 h-full" style={{ width: `${mp * 100}%` }} />
            {op > 0 ? (
              <div className="bg-muted-foreground/40 h-full" style={{ width: `${op * 100}%` }} />
            ) : null}
          </>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        <Legend swatch="bg-primary" label={t("analytics.audience.gender.female")} value={pct(fp)} />
        <Legend
          swatch="bg-primary/50"
          label={t("analytics.audience.gender.male")}
          value={pct(mp)}
        />
        <Legend
          swatch="bg-muted-foreground/40"
          label={t("analytics.audience.gender.other")}
          value={pct(op)}
        />
      </div>
    </div>
  );
}

function Legend({ swatch, label, value }: { swatch: string; label: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px]">
      <span className={`size-2.5 rounded-full ${swatch}`} />
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">· {value}</span>
    </span>
  );
}
