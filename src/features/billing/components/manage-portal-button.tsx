"use client";

/**
 * Stripe Billing Portal launcher — the web's cancel/resume/invoices surface.
 * Reuses the existing `openBillingPortal` path (create-portal-session) exactly
 * like the paywall's manage button; opened in a popup because the edge function
 * hard-codes a mobile return URL. Since invoices live in Stripe, this button IS
 * the receipts story on web (the mobile receipts.tsx has no web equivalent).
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { openBillingPortal } from "@/lib/vidcica/billing";
import { useT } from "@/lib/i18n/provider";

const POPUP = "width=520,height=760";

export function ManagePortalButton() {
  const t = useT();
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
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={manage} disabled={pending} data-testid="open-billing-portal">
        {pending ? t("billing.opening") : t("billing.managePlan")}
      </Button>
      {message ? (
        <p role="alert" className="text-destructive text-sm">
          {message}
        </p>
      ) : null}
    </div>
  );
}
