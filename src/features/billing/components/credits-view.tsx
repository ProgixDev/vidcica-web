"use client";

/**
 * Credits view — live balance ring + a real credit-history ledger. Mirrors the
 * mobile app/billing/credits.tsx (hero gauge + history list); the balance is
 * kept live over the `credits_accounts` realtime channel, the ledger rows come
 * from the RLS-scoped `credit_ledger` query passed in from the server.
 */
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useCreditsRealtime } from "@/lib/vidcica/use-credits-realtime";
import { LEDGER_REASON_KEY, type CreditLedgerEntry } from "@/lib/vidcica/credit-ledger";
import { tierDef, type Plan } from "@/lib/vidcica/tiers";
import { formatDate, formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { CreditRing } from "./credit-ring";

function CoinsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-foreground size-6"
      aria-hidden
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82" />
    </svg>
  );
}

export function CreditsView({
  userId,
  plan,
  initialCredits,
  entries,
}: {
  userId: string;
  plan: Plan;
  initialCredits: number;
  entries: CreditLedgerEntry[];
}) {
  const t = useT();
  const credits = useCreditsRealtime(userId, initialCredits);
  const allotment = tierDef(plan).monthlyCredits;
  const progress = allotment > 0 ? credits / allotment : 0;

  // Low balance is the one essential status here: under 15% of the allotment.
  const low = allotment > 0 && progress < 0.15;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-10">
      {/* Hero balance — neutral gauge, the count is the headline. */}
      <Card className="flex items-center gap-6 p-6" data-testid="credits-hero">
        <CreditRing progress={progress}>
          <CoinsIcon />
        </CreditRing>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-muted-foreground text-[13px]">
            {t("billing.credits.balanceLabel")}
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "text-4xl leading-none font-semibold tracking-[-0.03em] tabular-nums",
                low && "text-destructive",
              )}
              data-testid="credits-balance"
            >
              {formatNumber(credits)}
            </span>
            <span className="text-muted-foreground text-[15px]">{t("billing.credits.unit")}</span>
          </div>
          {allotment > 0 ? (
            <span className="text-muted-foreground text-[13px]">
              {t("billing.credits.allotmentNote", { total: formatNumber(allotment) })}
            </span>
          ) : null}
        </div>
      </Card>

      {/* Credit history ledger — real movements from credit_ledger. */}
      <section className="flex flex-col gap-4" data-testid="credit-ledger">
        <h2 className="text-xl font-semibold">{t("billing.ledger.title")}</h2>
        {entries.length === 0 ? (
          <Card>
            <EmptyState
              className="py-12"
              title={t("billing.ledger.empty.title")}
              description={t("billing.ledger.empty.body")}
            />
          </Card>
        ) : (
          <div className="divide-border flex flex-col divide-y">
            {entries.map((row) => {
              const positive = row.delta >= 0;
              return (
                <div
                  key={row.id}
                  className="flex min-h-14 items-center gap-4 py-3"
                  data-testid="ledger-row"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[15px] leading-snug font-semibold">
                      {t(LEDGER_REASON_KEY[row.category])}
                    </span>
                    <span className="text-muted-foreground text-[13px]">
                      {formatDate(new Date(row.createdAt))}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[15px] font-semibold tabular-nums",
                      positive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {positive ? "+" : "−"}
                    {formatNumber(Math.abs(row.delta))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          {t("billing.ledger.footerNote")}
        </p>
      </section>
    </div>
  );
}
