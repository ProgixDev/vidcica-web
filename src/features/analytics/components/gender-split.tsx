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
 * honest, never fabricated. Series are tones of the neutral scale.
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
    <div className="flex flex-col gap-4" data-testid="analytics-gender-split">
      <div className="bg-secondary flex h-3 overflow-hidden rounded-full">
        {has ? (
          <>
            <div className="bg-foreground h-full" style={{ width: `${fp * 100}%` }} />
            <div className="bg-muted-foreground h-full" style={{ width: `${mp * 100}%` }} />
            {op > 0 ? <div className="bg-accent h-full" style={{ width: `${op * 100}%` }} /> : null}
          </>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Legend
          swatch="bg-foreground"
          label={t("analytics.audience.gender.female")}
          value={pct(fp)}
        />
        <Legend
          swatch="bg-muted-foreground"
          label={t("analytics.audience.gender.male")}
          value={pct(mp)}
        />
        <Legend swatch="bg-accent" label={t("analytics.audience.gender.other")} value={pct(op)} />
      </div>
    </div>
  );
}

function Legend({ swatch, label, value }: { swatch: string; label: string; value: string }) {
  return (
    <span className="flex items-center gap-2 text-[13px]">
      <span className={`size-2.5 rounded-full ${swatch}`} />
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground tabular-nums">{value}</span>
    </span>
  );
}
