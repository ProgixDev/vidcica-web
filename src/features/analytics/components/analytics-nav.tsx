"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import { RANGE_VALUES, RANGE_KEY, parseRange, type AnalyticsTab } from "@/lib/vidcica/analytics";
import type { MessageKey } from "@/lib/i18n";

const TABS: ReadonlyArray<{ key: AnalyticsTab; href: string; labelKey: MessageKey }> = [
  { key: "overview", href: "/analytics", labelKey: "analytics.tabs.overview" },
  { key: "videos", href: "/analytics/videos", labelKey: "analytics.tabs.videos" },
  { key: "audience", href: "/analytics/audience", labelKey: "analytics.tabs.audience" },
  { key: "ads", href: "/analytics/ads", labelKey: "analytics.tabs.ads" },
];

function activeTab(pathname: string): AnalyticsTab {
  if (pathname.endsWith("/videos")) return "videos";
  if (pathname.endsWith("/audience")) return "audience";
  if (pathname.endsWith("/ads")) return "ads";
  return "overview";
}

/**
 * Secondary tab strip + range SegmentedControl for the analytics section. The
 * selected range persists in the `?range=` search param (7d/30d/90d) and is
 * carried across tab links so switching tabs keeps the window.
 */
export function AnalyticsNav() {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const range = parseRange(params.get("range") ?? undefined);
  const active = activeTab(pathname);
  const rangeQuery = `?range=${range}`;

  function setRange(next: string) {
    const usp = new URLSearchParams(params.toString());
    usp.set("range", next);
    router.replace(`${pathname}?${usp.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2" role="tablist" data-testid="analytics-tabs">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Link
              key={tab.key}
              href={`${tab.href}${rangeQuery}`}
              role="tab"
              aria-selected={isActive}
              data-testid={`analytics-tab-${tab.key}`}
              className={cn(
                "rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-colors",
                isActive
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </div>

      <div
        className="bg-muted inline-flex w-fit gap-0.5 rounded-full p-0.5"
        role="group"
        aria-label={t("analytics.range.label")}
        data-testid="analytics-range"
      >
        {RANGE_VALUES.map((r) => {
          const isActive = r === range;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={isActive}
              data-testid={`analytics-range-${r}`}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                isActive
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(RANGE_KEY[r])}
            </button>
          );
        })}
      </div>
    </div>
  );
}
