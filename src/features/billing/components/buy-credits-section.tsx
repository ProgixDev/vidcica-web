"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { startCreditCheckout } from "@/lib/vidcica/billing";
import type { CreditPack } from "@/lib/vidcica/billing-queries";
import { useT } from "@/lib/i18n/provider";
import { formatNumber } from "@/lib/format";

const POPUP = "width=520,height=760";

/** Buy-credits panel: one card per pack. Opens Stripe Checkout in a popup (like
 *  the subscription paywall) and detects the top-up via the credit balance rising
 *  (the stripe-webhook grants the pack before the popup returns). The live balance
 *  ring in CreditsView updates on its own over realtime. */
export function BuyCreditsSection({ packs }: { packs: CreditPack[] }) {
  const t = useT();
  const router = useRouter();
  const [pending, setPending] = useState<number | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  if (packs.length === 0) return null;

  async function buy(pack: CreditPack) {
    // Popup MUST be opened synchronously in the click handler (browser gesture).
    const popup = typeof window !== "undefined" ? window.open("", "vidcica-credits", POPUP) : null;
    const controller = new AbortController();
    abortRef.current = controller;
    setPending(pack.credits);
    setMessage(null);
    const supabase = createClient();
    const out = await startCreditCheckout(supabase, pack.credits, popup, {
      signal: controller.signal,
    });
    if (controller.signal.aborted) return;
    setPending(null);
    if (out.ok) {
      setMessage({ kind: "ok", text: t("billing.credits.bought") });
      router.refresh();
    } else if (out.reason === "not_configured") {
      setMessage({ kind: "err", text: t("billing.checkoutUnavailable") });
    } else if (out.reason !== "cancelled") {
      setMessage({ kind: "err", text: t("billing.checkoutFailed") });
    }
  }

  const nameOf = (label: string) => label.split("—")[0]?.trim() ?? "";
  // Highlight the middle pack as "popular".
  const popularCredits =
    packs.length > 1 ? packs[Math.floor(packs.length / 2)]?.credits : undefined;

  return (
    <section className="flex flex-col gap-3 lg:sticky lg:top-6" data-testid="buy-credits">
      <div className="flex flex-col gap-0.5 px-1">
        <h2 className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
          {t("billing.credits.buyTitle")}
        </h2>
        <p className="text-muted-foreground text-xs">{t("billing.credits.buySubtitle")}</p>
      </div>

      {message ? (
        <p
          role={message.kind === "err" ? "alert" : undefined}
          className={cn(
            "px-1 text-sm font-medium",
            message.kind === "ok" ? "text-success" : "text-destructive",
          )}
          data-testid="buy-credits-message"
        >
          {message.text}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {packs.map((pack) => {
          const isPopular = pack.credits === popularCredits;
          const name = nameOf(pack.label);
          return (
            <Card
              key={pack.credits}
              className={cn(
                "relative flex flex-col gap-3 p-4",
                isPopular ? "border-primary shadow-sm" : "",
              )}
            >
              {isPopular ? (
                <Badge variant="brand" className="absolute -top-2 right-3">
                  {t("billing.credits.popular")}
                </Badge>
              ) : null}
              <div className="flex flex-col gap-0.5">
                {name ? (
                  <span className="text-muted-foreground text-xs font-medium">{name}</span>
                ) : null}
                <span className="text-2xl font-semibold tracking-tight tabular-nums">
                  {formatNumber(pack.credits)}{" "}
                  <span className="text-muted-foreground text-sm font-normal">
                    {t("billing.credits.unit")}
                  </span>
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-semibold">{pack.priceEur} €</span>
                <span className="text-muted-foreground text-xs">
                  {t("billing.credits.oneTime")}
                </span>
              </div>
              <Button
                className="mt-auto w-full rounded-full"
                size="sm"
                onClick={() => buy(pack)}
                disabled={pending !== null}
                data-testid={`buy-pack-${pack.credits}`}
              >
                {pending === pack.credits ? t("billing.credits.buying") : t("billing.credits.buy")}
              </Button>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
