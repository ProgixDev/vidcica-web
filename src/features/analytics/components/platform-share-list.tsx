import { PlatformIcon } from "@/components/platform-icon";
import { formatNumber } from "@/lib/format";
import { PLATFORMS, type PlatformId } from "@/lib/vidcica/network";

const PLATFORM_LABEL = new Map<PlatformId, string>(PLATFORMS.map((p) => [p.id, p.label]));

export type PlatformShareRow = {
  platform: PlatformId;
  /** Primary metric (followers / views). */
  value: number;
  /** 0..1 share of the total — drives the bar width. */
  share: number;
};

/**
 * Stacked rows showing each connected platform's share of a metric. Hand-built
 * bars (neutral tones). Feeds on real follower counts on the audience screen.
 */
export function PlatformShareList({ rows }: { rows: ReadonlyArray<PlatformShareRow> }) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  return (
    <div className="bg-card divide-border flex flex-col divide-y overflow-hidden rounded-lg">
      {sorted.map((row) => (
        <div key={row.platform} className="flex min-h-16 items-center gap-4 px-5 py-4">
          <span className="bg-secondary flex size-10 shrink-0 items-center justify-center rounded-full">
            <PlatformIcon platform={row.platform} size={22} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <span className="truncate text-[15px] font-semibold">
                {PLATFORM_LABEL.get(row.platform) ?? row.platform}
              </span>
              <span className="text-[15px] font-semibold tabular-nums">
                {formatNumber(row.value)}
              </span>
            </div>
            <div className="bg-secondary h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-foreground h-full rounded-full"
                style={{ width: `${Math.max(2, row.share * 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
