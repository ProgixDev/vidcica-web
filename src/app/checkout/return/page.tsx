import type { Metadata } from "next";
import { z } from "zod";
import { CheckoutReturnView } from "./view";

export const metadata: Metadata = {
  title: "Paiement",
  // A popup landing page, never a destination — keep it out of search results.
  robots: { index: false, follow: false },
};

const statusSchema = z.enum(["success", "cancel", "portal", "has_subscription"]);

/**
 * Stripe return page — where Checkout and the customer portal send the popup
 * back (create-checkout-session / create-portal-session build
 * `<allowlisted origin>/checkout/return?status=…` since 2026-10-18).
 *
 * Like /oauth/connected: OUTSIDE the `(app)` group (bare root layout, it renders
 * in a popup) and public (not in the middleware's PROTECTED_PREFIXES), so a
 * popup is never bounced to /sign-in. It shows no account data; the opener
 * reads the real state (plan, credits) from the database.
 */
export default async function CheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const parsed = statusSchema.safeParse(status);
  return <CheckoutReturnView status={parsed.success ? parsed.data : "cancel"} />;
}
