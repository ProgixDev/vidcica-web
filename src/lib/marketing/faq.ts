import type { MessageKey } from "@/lib/i18n";

/**
 * The public FAQ, in display order. Shared by the landing section and `/faq`
 * so one edit changes both — and so the FAQPage structured data on `/faq`
 * always matches what the landing shows.
 */
export const FAQ_ITEMS: ReadonlyArray<{ q: MessageKey; a: MessageKey }> = [
  { q: "landing.faq.credits.q", a: "landing.faq.credits.a" },
  { q: "landing.faq.ownership.q", a: "landing.faq.ownership.a" },
  { q: "landing.faq.royaltyFree.q", a: "landing.faq.royaltyFree.a" },
  { q: "landing.faq.networks.q", a: "landing.faq.networks.a" },
  { q: "landing.faq.voiceLangs.q", a: "landing.faq.voiceLangs.a" },
  { q: "landing.faq.billing.q", a: "landing.faq.billing.a" },
];
