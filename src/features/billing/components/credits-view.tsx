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
      className="text-primary size-6"
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

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      {/* Hero balance — the gauge carries the brand colour, a soft accent tint
          lifts the card, the count stays the headline. */}
      <Card className="bg-accent/40 flex items-center gap-5 p-5" data-testid="credits-hero">
        <CreditRing progress={progress}>
          <CoinsIcon />
        </CreditRing>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
            {t("billing.credits.balanceLabel")}
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className="text-4xl font-semibold tracking-tight tabular-nums"
              data-testid="credits-balance"
            >
              {formatNumber(credits)}
            </span>
            <span className="text-muted-foreground text-sm">{t("billing.credits.unit")}</span>
          </div>
          {allotment > 0 ? (
            <span className="text-muted-foreground text-xs">
              {t("billing.credits.allotmentNote", { total: formatNumber(allotment) })}
            </span>
          ) : null}
        </div>
      </Card>

      {/* Credit history ledger — real movements from credit_ledger. */}
      <section className="flex flex-col gap-2" data-testid="credit-ledger">
        <h2 className="text-muted-foreground px-1 text-[11px] font-semibold tracking-widest uppercase">
          {t("billing.ledger.title")}
        </h2>
        {entries.length === 0 ? (
          <Card className="p-2">
            <EmptyState
              className="py-10"
              title={t("billing.ledger.empty.title")}
              description={t("billing.ledger.empty.body")}
            />
          </Card>
        ) : (
          <div className="bg-card divide-border/60 flex flex-col divide-y rounded-2xl border">
            {entries.map((row) => {
              const positive = row.delta >= 0;
              return (
                <div
                  key={row.id}
                  className="flex items-center gap-3 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl"
                  data-testid="ledger-row"
                >
                  <span
                    className={
                      positive
                        ? "bg-success/15 text-success flex size-8 shrink-0 items-center justify-center rounded-full"
                        : "bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full"
                    }
                    aria-hidden
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4"
                    >
                      {positive ? (
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      ) : (
                        <path d="M12 5v14M5 12l7 7 7-7" />
                      )}
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {t(LEDGER_REASON_KEY[row.category])}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(new Date(row.createdAt))}
                    </span>
                  </span>
                  <span
                    className={
                      positive
                        ? "text-success shrink-0 text-sm font-semibold tabular-nums"
                        : "shrink-0 text-sm font-semibold tabular-nums"
                    }
                  >
                    {positive ? "+" : "−"}
                    {formatNumber(Math.abs(row.delta))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <p className="text-muted-foreground px-1 text-center text-xs leading-relaxed">
        {t("billing.ledger.footerNote")}
      </p>
    </div>
  );
}
