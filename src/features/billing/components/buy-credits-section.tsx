"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { startCreditCheckout } from "@/lib/vidcica/billing";
import type { CreditPack } from "@/lib/vidcica/billing-queries";
import { useLocale, useT } from "@/lib/i18n/provider";
import { formatNumber } from "@/lib/format";
import { formatCents } from "../format";
import { packViews, type PackView } from "../packs";

const POPUP = "width=520,height=760";

/** Buy-credits section: one card per pack. Opens Stripe Checkout in a popup (like
 *  the subscription paywall) and detects the top-up by a new `stripe_pack` ledger
 *  row (stripe-webhook grants it once the payment clears). A payment reported but
 *  not granted yet reads "payment received", never "failed". Balances elsewhere
 *  update on their own over realtime.
 *
 *  `grid`: the billing page, packs side by side under the plans (anchor `#packs`,
 *  where the low-balance and not-enough-credits links land). `stack`: the credits
 *  page's side column. */
export function BuyCreditsSection({
  packs,
  layout = "stack",
  id,
}: {
  packs: CreditPack[];
  layout?: "grid" | "stack";
  id?: string;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, setPending] = useState<number | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const views = packViews(packs);
  if (views.length === 0) return null;

  async function buy(pack: PackView) {
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
    } else if (out.reason === "pending") {
      setMessage({ kind: "ok", text: t("billing.checkoutPending") });
    } else if (out.reason === "not_configured") {
      setMessage({ kind: "err", text: t("billing.checkoutUnavailable") });
    } else if (out.reason === "error") {
      setMessage({ kind: "err", text: t("billing.checkoutFailed") });
    }
  }

  return (
    <section
      id={id}
      className={cn("flex scroll-mt-24 flex-col gap-4", layout === "stack" && "lg:sticky lg:top-6")}
      data-testid="buy-credits"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{t("billing.credits.buyTitle")}</h2>
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          {t("billing.credits.buySubtitle")}
        </p>
      </div>

      {message ? (
        <p
          role={message.kind === "err" ? "alert" : "status"}
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

      <div className={layout === "grid" ? "grid gap-4 sm:grid-cols-3" : "flex flex-col gap-3"}>
        {views.map((pack) => (
          <PackCard
            key={pack.credits}
            pack={pack}
            compact={layout === "stack"}
            // One filled action per group: the popular pack's, or the only pack's.
            primary={pack.popular || views.length === 1}
            pending={pending}
            onBuy={() => void buy(pack)}
          />
        ))}
      </div>
    </section>
  );
}

function PackCard({
  pack,
  compact,
  primary,
  pending,
  onBuy,
}: {
  pack: PackView;
  compact: boolean;
  primary: boolean;
  pending: number | null;
  onBuy: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const price = formatCents(pack.priceCents, "eur", locale);
  const unit = formatCents(pack.unitCents, "eur", locale);
  const button = (
    <Button
      size={compact ? "sm" : "default"}
      variant={primary ? "default" : "secondary"}
      className={compact ? "shrink-0" : "mt-auto w-full"}
      onClick={onBuy}
      disabled={pending !== null}
      data-testid={`buy-pack-${pack.credits}`}
    >
      {pending === pack.credits ? t("billing.credits.buying") : t("billing.credits.buy")}
    </Button>
  );
  const unitLine = (
    <span className="text-muted-foreground flex flex-wrap items-center gap-2 text-[13px]">
      {t("billing.credits.perCredit", { price: unit })}
      {pack.savePct !== null ? (
        <Badge variant="outline">{t("billing.credits.save", { pct: pack.savePct })}</Badge>
      ) : null}
    </span>
  );

  if (compact) {
    return (
      <div
        className="bg-card flex items-center gap-4 rounded-lg p-5"
        data-testid={`pack-${pack.credits}`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xl leading-tight font-semibold tracking-[-0.02em] tabular-nums">
              {formatNumber(pack.credits)}{" "}
              <span className="text-muted-foreground text-[13px] font-normal tracking-normal">
                {t("billing.credits.unit")}
              </span>
            </span>
            {pack.popular ? <Badge variant="brand">{t("billing.credits.popular")}</Badge> : null}
          </div>
          <span className="text-[13px]">
            <span className="font-semibold">{price}</span>{" "}
            <span className="text-muted-foreground">· {t("billing.credits.oneTime")}</span>
          </span>
          {unitLine}
        </div>
        {button}
      </div>
    );
  }

  // Same anatomy as the plan cards above it: title row, big price with its
  // term ("paiement unique" where a plan says "/ mois"), detail, action.
  return (
    <div
      className="bg-card flex flex-col gap-6 rounded-lg p-6"
      data-testid={`pack-${pack.credits}`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex min-h-6 items-center justify-between gap-2">
          <span className="text-[15px] font-semibold tabular-nums">
            {formatNumber(pack.credits)} {t("billing.credits.unit")}
          </span>
          {pack.popular ? <Badge variant="brand">{t("billing.credits.popular")}</Badge> : null}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl leading-none font-semibold tracking-[-0.03em] tabular-nums">
            {price}
          </span>
          <span className="text-muted-foreground text-[13px]">{t("billing.credits.oneTime")}</span>
        </div>
      </div>
      {unitLine}
      {button}
    </div>
  );
}
