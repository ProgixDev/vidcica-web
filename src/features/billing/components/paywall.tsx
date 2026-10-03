"use client";

// Adapted from packs/payments-stripe/src/ui/paywall.tsx — expanded into the real
// plan-comparison paywall and wired to Vidcica's existing edge functions
// (create-checkout-session / create-portal-session), not the pack's Stripe SDK.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { openBillingPortal, startCheckout } from "@/lib/vidcica/billing";
import { ORDERED_TIERS, TIERS, isUpgrade, type Entitlement, type Plan } from "@/lib/vidcica/tiers";
import { useCreditsRealtime } from "@/lib/vidcica/use-credits-realtime";
import { useT } from "@/lib/i18n/provider";

const POPUP = "width=520,height=760";

export function Paywall({ userId, entitlement }: { userId: string; entitlement: Entitlement }) {
  const t = useT();
  const router = useRouter();
  const current = entitlement.plan;
  const credits = useCreditsRealtime(userId, entitlement.credits);
  const [pendingPlan, setPendingPlan] = useState<Plan | "portal" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  async function subscribe(plan: Plan) {
    const popup = typeof window !== "undefined" ? window.open("", "vidcica-checkout", POPUP) : null;
    const controller = new AbortController();
    abortRef.current = controller;
    setPendingPlan(plan);
    setMessage(null);
    const supabase = createClient();
    const out = await startCheckout(supabase, plan, popup, { signal: controller.signal });
    if (controller.signal.aborted) return;
    setPendingPlan(null);
    if (out.ok) router.refresh();
    else if (out.reason === "not_configured") setMessage(t("billing.checkoutUnavailable"));
    else if (out.reason !== "cancelled") setMessage(t("billing.checkoutFailed"));
  }

  async function manage() {
    const popup = typeof window !== "undefined" ? window.open("", "vidcica-portal", POPUP) : null;
    const controller = new AbortController();
    abortRef.current = controller;
    setPendingPlan("portal");
    setMessage(null);
    const supabase = createClient();
    const out = await openBillingPortal(supabase, popup);
    if (controller.signal.aborted) return;
    setPendingPlan(null);
    if (!out.ok) {
      if (out.reason === "no_customer") setMessage(t("billing.portalNoCustomer"));
      else if (out.reason === "not_configured") setMessage(t("billing.portalUnavailable"));
      else setMessage(t("billing.portalFailed"));
    }
  }

  // One filled action in the grid: the next tier up is the ink pill, the rest pale.
  const nextUp = ORDERED_TIERS.find((id) => isUpgrade(current, id));

  return (
    <div className="flex flex-col gap-10" data-testid="paywall">
      {/* Current plan + live credits — a quiet summary strip, one pale action. */}
      <div className="bg-card flex flex-wrap items-center justify-between gap-x-10 gap-y-5 rounded-lg p-6">
        <div className="flex flex-wrap gap-x-12 gap-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-[13px]">{t("billing.currentPlan")}</span>
            <span
              className="text-2xl leading-tight font-semibold tracking-[-0.02em]"
              data-testid="current-plan"
            >
              {t(TIERS[current].labelKey)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-[13px]">
              {t("billing.creditsThisMonth")}
            </span>
            <span
              className="text-2xl leading-tight font-semibold tracking-[-0.02em] tabular-nums"
              data-testid="credits-balance"
            >
              {credits}
            </span>
          </div>
        </div>
        {current !== "free" ? (
          <Button variant="secondary" size="sm" onClick={manage} disabled={pendingPlan !== null}>
            {pendingPlan === "portal" ? t("billing.opening") : t("billing.managePlan")}
          </Button>
        ) : null}
      </div>

      {message ? (
        <p
          role="alert"
          className="bg-destructive-subtle text-destructive rounded-md px-4 py-3 text-[13px] font-semibold"
        >
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ORDERED_TIERS.map((id) => {
          const tier = TIERS[id];
          const isCurrent = id === current;
          const upgradable = isUpgrade(current, id);
          return (
            <div
              key={id}
              data-testid={`plan-${id}`}
              className={cn(
                "flex flex-col gap-6 rounded-lg p-6",
                // The marked plan is one neutral step deeper — never a border or glow.
                isCurrent ? "bg-accent" : "bg-card",
              )}
            >
              <div className="flex flex-col gap-3">
                <div className="flex min-h-6 items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold">{t(tier.labelKey)}</span>
                  {isCurrent ? <Badge variant="brand">{t("billing.currentBadge")}</Badge> : null}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl leading-none font-semibold tracking-[-0.03em] tabular-nums">
                    {tier.priceEUR} €
                  </span>
                  <span className="text-muted-foreground text-[13px]">{t("billing.perMonth")}</span>
                </div>
              </div>
              <ul className="flex flex-col gap-2.5 text-[15px] leading-snug">
                {tier.highlightKeys.map((k) => (
                  <li key={k} className="flex items-start gap-2.5">
                    <CheckIcon />
                    <span>{t(k)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex min-h-10 items-center">
                {isCurrent ? (
                  <p className="text-muted-foreground text-[13px]">{t("billing.yourPlan")}</p>
                ) : upgradable ? (
                  <Button
                    className="w-full"
                    variant={id === nextUp ? "default" : "secondary"}
                    onClick={() => subscribe(id)}
                    disabled={pendingPlan !== null}
                    data-testid={`subscribe-${id}`}
                  >
                    {pendingPlan === id
                      ? t("billing.redirecting")
                      : t("billing.upgradeTo", { plan: t(tier.labelKey) })}
                  </Button>
                ) : (
                  <p className="text-muted-foreground text-[13px]">
                    {tier.priceEUR === 0 ? t("billing.basePlan") : t("billing.includedInPlan")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground mt-0.5 size-4 shrink-0"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
