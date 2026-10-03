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
    <section className="flex flex-col gap-4 lg:sticky lg:top-6" data-testid="buy-credits">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{t("billing.credits.buyTitle")}</h2>
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          {t("billing.credits.buySubtitle")}
        </p>
      </div>

      {message ? (
        <p
          role={message.kind === "err" ? "alert" : undefined}
          className={cn(
            "rounded-md px-4 py-3 text-[13px] font-semibold",
            message.kind === "ok"
              ? "bg-success-subtle text-success"
              : "bg-destructive-subtle text-destructive",
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
            <Card key={pack.credits} className="flex items-center gap-4 p-5">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl leading-tight font-semibold tracking-[-0.02em] tabular-nums">
                    {formatNumber(pack.credits)}{" "}
                    <span className="text-muted-foreground text-[13px] font-normal tracking-normal">
                      {t("billing.credits.unit")}
                    </span>
                  </span>
                  {isPopular ? <Badge variant="brand">{t("billing.credits.popular")}</Badge> : null}
                </div>
                <span className="text-muted-foreground truncate text-[13px]">
                  {name ? `${name} · ` : ""}
                  <span className="text-foreground font-semibold">{pack.priceEur} €</span>{" "}
                  {t("billing.credits.oneTime")}
                </span>
              </div>
              <Button
                size="sm"
                variant={isPopular || popularCredits === undefined ? "default" : "secondary"}
                className="shrink-0"
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
