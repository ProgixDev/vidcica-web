"use client";

/**
 * Stripe customer portal launcher: card, billing details and invoices (plan
 * changes and cancelling live on the Abonnement page since 2026-10-18, through
 * change-plan). Opened in a popup that Stripe returns to /checkout/return; the
 * page is re-read once the person is done. Since invoices live in Stripe, this
 * button IS the receipts story on web.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { openBillingPortal } from "@/lib/vidcica/billing";
import { useT } from "@/lib/i18n/provider";

const POPUP = "width=520,height=760";

export function ManagePortalButton() {
  const t = useT();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function manage() {
    const popup = typeof window !== "undefined" ? window.open("", "vidcica-portal", POPUP) : null;
    setPending(true);
    setMessage(null);
    const supabase = createClient();
    const out = await openBillingPortal(supabase, popup);
    setPending(false);
    if (!out.ok) {
      if (out.reason === "no_customer") setMessage(t("billing.portalNoCustomer"));
      else if (out.reason === "not_configured") setMessage(t("billing.portalUnavailable"));
      else setMessage(t("billing.portalFailed"));
      return;
    }
    void out.closed.then(() => router.refresh());
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <Button onClick={manage} disabled={pending} data-testid="open-billing-portal">
        {pending ? t("billing.opening") : t("billing.cardAndInvoices")}
      </Button>
      {message ? (
        <p role="alert" className="text-destructive text-[13px]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
