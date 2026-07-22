import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type KpiTileProps = {
  icon?: ReactNode;
  label: string;
  value: string;
  /** Muted secondary line under the value. */
  hint?: string;
  /** Soft brand emphasis on the tile. */
  brand?: boolean;
  testId?: string;
};

/**
 * A single dense KPI tile — icon + label, big value, optional hint. Pure /
 * server-renderable (all display strings come in as props). Token colours only.
 */
export function KpiTile({ icon, label, value, hint, brand, testId }: KpiTileProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "flex min-w-0 flex-1 basis-40 flex-col gap-1.5 rounded-2xl border p-3.5",
        brand ? "border-primary/30 bg-primary/5" : "bg-card border-border",
      )}
    >
      <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
        {icon ? <span className={brand ? "text-primary" : undefined}>{icon}</span> : null}
        <span className="truncate">{label}</span>
      </div>
      <div className="text-lg leading-none font-semibold tracking-tight">{value}</div>
      {hint ? <div className="text-muted-foreground text-[11px]">{hint}</div> : null}
    </div>
  );
}
