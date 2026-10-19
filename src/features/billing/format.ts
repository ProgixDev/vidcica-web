/** Formatting for the billing screens (amounts come from Stripe in cents). */

export function formatCents(cents: number, currency: string, locale: "fr" | "en"): string {
  const amount = cents / 100;
  return new Intl.NumberFormat(locale === "en" ? "en-IE" : "fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

/** "25 octobre 2026" / "25 October 2026". */
export function formatBillingDate(iso: string, locale: "fr" | "en"): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-IE" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}
