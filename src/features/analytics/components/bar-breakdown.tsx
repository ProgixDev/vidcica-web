export type BarBreakdownItem = {
  label: string;
  share: number; // 0..1
};

/**
 * Generic horizontal % bar list — age & country breakdowns on the audience
 * screen. With all-zero shares (no collection yet) it honestly renders 0 % rows
 * with empty bars. Hand-built, token colours.
 */
export function BarBreakdown({ items }: { items: ReadonlyArray<BarBreakdownItem> }) {
  const max = Math.max(...items.map((d) => d.share), 0.01);
  return (
    <div className="flex flex-col gap-2.5" data-testid="analytics-bar-breakdown">
      {items.map((item) => {
        const fill = (item.share / max) * 100;
        return (
          <div key={item.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground">{Math.round(item.share * 100)} %</span>
            </div>
            <div className="bg-muted h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${item.share > 0 ? Math.max(4, fill) : 0}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
