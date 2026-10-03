import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { TFunction } from "@/lib/i18n";

/** Lock icon (inline SVG — the web app has no icon dependency in this slice). */
function LockGlyph() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/**
 * Plan gate for the analytics section — mirrors the mobile `isAnalyticsLocked`
 * (free plan has no analytics). Shows an honest locked state with an upgrade CTA
 * to the billing page rather than empty dashboards.
 */
export function AnalyticsLocked({ t }: { t: TFunction }) {
  return (
    <div className="w-full max-w-3xl" data-testid="analytics-locked">
      <EmptyState
        className="py-16"
        icon={<LockGlyph />}
        title={t("analytics.locked.title")}
        description={t("analytics.locked.body")}
        action={
          <Link href="/billing" className={buttonVariants()}>
            {t("common.upgrade")}
          </Link>
        }
      />
    </div>
  );
}
