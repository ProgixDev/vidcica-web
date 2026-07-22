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

  return (
    <div className="flex flex-col gap-6" data-testid="paywall">
      <div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-xs">{t("billing.currentPlan")}</span>
          <span className="text-lg font-semibold" data-testid="current-plan">
            {t(TIERS[current].labelKey)}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-muted-foreground text-xs">{t("billing.creditsThisMonth")}</span>
            <span className="font-semibold" data-testid="credits-balance">
              {credits}
            </span>
          </div>
          {current !== "free" ? (
            <Button variant="outline" size="sm" onClick={manage} disabled={pendingPlan !== null}>
              {pendingPlan === "portal" ? t("billing.opening") : t("billing.managePlan")}
            </Button>
          ) : null}
        </div>
      </div>

      {message ? (
        <p role="alert" className="text-destructive text-sm">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ORDERED_TIERS.map((id) => {
          const tier = TIERS[id];
          const isCurrent = id === current;
          const upgradable = isUpgrade(current, id);
          return (
            <div
              key={id}
              data-testid={`plan-${id}`}
              className={cn(
                "flex flex-col gap-3 rounded-xl border p-4",
                isCurrent && "border-primary bg-accent/40",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t(tier.labelKey)}</span>
                {isCurrent ? <Badge variant="brand">{t("billing.currentBadge")}</Badge> : null}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-semibold tracking-tight">{tier.priceEUR} €</span>
                <span className="text-muted-foreground text-xs">{t("billing.perMonth")}</span>
              </div>
              <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
                {tier.highlightKeys.map((k) => (
                  <li key={k}>· {t(k)}</li>
                ))}
              </ul>
              <div className="mt-auto pt-2">
                {isCurrent ? (
                  <p className="text-muted-foreground text-center text-xs">
                    {t("billing.yourPlan")}
                  </p>
                ) : upgradable ? (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => subscribe(id)}
                    disabled={pendingPlan !== null}
                    data-testid={`subscribe-${id}`}
                  >
                    {pendingPlan === id
                      ? t("billing.redirecting")
                      : t("billing.upgradeTo", { plan: t(tier.labelKey) })}
                  </Button>
                ) : (
                  <p className="text-muted-foreground text-center text-xs">
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
