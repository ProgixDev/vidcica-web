"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";
import { BILLING_CHANNEL, type ReturnStatus } from "@/lib/vidcica/billing";
import type { MessageKey } from "@/lib/i18n";

/** Long enough to read the confirmation, short enough not to linger. */
const AUTO_CLOSE_MS = 1500;

const COPY: Record<ReturnStatus, { title: MessageKey; body: MessageKey }> = {
  success: { title: "billing.return.successTitle", body: "billing.return.successBody" },
  cancel: { title: "billing.return.cancelTitle", body: "billing.return.cancelBody" },
  portal: { title: "billing.return.portalTitle", body: "billing.return.portalBody" },
  has_subscription: {
    title: "billing.return.hasSubscriptionTitle",
    body: "billing.return.hasSubscriptionBody",
  },
};

/**
 * The popup's last frame. It tells the Vidcica window what happened (the
 * BroadcastChannel reaches it even when a bank page cut the opener link, and
 * postMessage covers browsers without BroadcastChannel), then closes itself.
 * Without an opener (the popup was blocked and Stripe ran in the main tab) it
 * goes to the billing page instead of stranding the person here.
 */
export function CheckoutReturnView({ status }: { status: ReturnStatus }) {
  const t = useT();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const message = { type: BILLING_CHANNEL, status };
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(BILLING_CHANNEL);
      channel.postMessage(message);
      channel.close();
    }
    const opener = window.opener as Window | null;
    if (!opener) {
      window.location.replace(`/billing?status=${encodeURIComponent(status)}`);
      return;
    }
    try {
      opener.postMessage(message, window.location.origin);
    } catch {
      // The opener is on another origin or gone: the channel already told it.
    }
    const timer = setTimeout(() => {
      window.close();
      // Still here a beat later => the browser blocked the close.
      setTimeout(() => setStuck(true), 400);
    }, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [status]);

  const copy = COPY[status];
  return (
    <main
      className="bg-background flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center"
      data-testid="checkout-return"
    >
      <LogoMark className="size-12" />
      <h1 className="mt-8 text-[28px] leading-tight font-semibold tracking-[-0.03em]">
        {t(copy.title)}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-xs text-[15px] leading-relaxed">
        {t(copy.body)}
      </p>
      {stuck ? (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button variant="secondary" onClick={() => window.close()}>
            {t("common.close")}
          </Button>
          <Link href="/billing" className="text-[15px] font-semibold underline underline-offset-4">
            {t("billing.return.backToBilling")}
          </Link>
        </div>
      ) : null}
    </main>
  );
}
