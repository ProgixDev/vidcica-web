import type { ReactNode } from "react";

export type KpiTileProps = {
  icon?: ReactNode;
  label: string;
  value: string;
  /** Muted secondary line under the value. */
  hint?: string;
  /** Kept for call-site compatibility. Identity 01 has no accent-tinted tiles, so
   *  this no longer changes the look. */
  brand?: boolean;
  testId?: string;
};

/**
 * A single KPI tile — muted label, big neutral number, optional hint. Pure /
 * server-renderable (all display strings come in as props). The parent lays the
 * tiles out in a grid.
 */
export function KpiTile({ icon, label, value, hint, testId }: KpiTileProps) {
  return (
    <div data-testid={testId} className="bg-card flex min-w-0 flex-col gap-3 rounded-lg p-5">
      <div className="text-muted-foreground flex items-center gap-2 text-[13px]">
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <span className="truncate">{label}</span>
      </div>
      <div className="truncate text-[28px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
        {value}
      </div>
      {hint ? <div className="text-muted-foreground text-[13px]">{hint}</div> : null}
    </div>
  );
}
