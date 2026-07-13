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
import { ORDERED_TIERS, TIERS, isUpgrade, type Plan } from "@/lib/vidcica/tiers";
import { useCreditsRealtime } from "@/lib/vidcica/use-credits-realtime";
import type { Entitlement } from "@/lib/vidcica/billing-queries";

const POPUP = "width=520,height=760";

export function Paywall({ userId, entitlement }: { userId: string; entitlement: Entitlement }) {
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
    else if (out.reason === "not_configured")
      setMessage("Le paiement est momentanément indisponible. Réessayez plus tard.");
    else if (out.reason !== "cancelled") setMessage("Le paiement a échoué. Réessayez.");
  }

  async function manage() {
    const popup = typeof window !== "undefined" ? window.open("", "vidcica-portal", POPUP) : null;
    setPendingPlan("portal");
    setMessage(null);
    const supabase = createClient();
    const out = await openBillingPortal(supabase, popup);
    setPendingPlan(null);
    if (!out.ok) {
      if (out.reason === "no_customer") setMessage("Aucun abonnement à gérer pour le moment.");
      else if (out.reason === "not_configured")
        setMessage("La gestion est momentanément indisponible.");
      else setMessage("Impossible d’ouvrir la gestion. Réessayez.");
    }
  }

  return (
    <div className="flex flex-col gap-6" data-testid="paywall">
      <div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-xs">Offre actuelle</span>
          <span className="text-lg font-semibold" data-testid="current-plan">
            {TIERS[current].label}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-muted-foreground text-xs">Crédits ce mois</span>
            <span className="font-semibold" data-testid="credits-balance">
              {credits}
            </span>
          </div>
          {current !== "free" ? (
            <Button variant="outline" size="sm" onClick={manage} disabled={pendingPlan !== null}>
              {pendingPlan === "portal" ? "Ouverture…" : "Gérer mon abonnement"}
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
                <span className="font-semibold">{tier.label}</span>
                {isCurrent ? <Badge variant="brand">Actuel</Badge> : null}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-semibold tracking-tight">{tier.priceEUR} €</span>
                <span className="text-muted-foreground text-xs">/ mois</span>
              </div>
              <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
                {tier.highlights.map((h) => (
                  <li key={h}>· {h}</li>
                ))}
              </ul>
              <div className="mt-auto pt-2">
                {isCurrent ? (
                  <p className="text-muted-foreground text-center text-xs">Votre offre</p>
                ) : upgradable ? (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => subscribe(id)}
                    disabled={pendingPlan !== null}
                    data-testid={`subscribe-${id}`}
                  >
                    {pendingPlan === id ? "Redirection…" : `Passer à ${tier.label}`}
                  </Button>
                ) : (
                  <p className="text-muted-foreground text-center text-xs">
                    {tier.priceEUR === 0 ? "Offre de base" : "Inclus dans votre offre"}
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
