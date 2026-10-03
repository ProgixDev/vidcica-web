import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PricingCards } from "@/components/pricing-cards";
import { FaqAccordion } from "@/components/faq-accordion";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/marketing-chrome";
import { TrackedLink } from "@/components/tracked-link";
import { getLocale, getT } from "@/lib/i18n/server";
import { localizedPath } from "@/lib/i18n/routing";
import { ORDERED_TIERS, TIERS } from "@/lib/vidcica/tiers";
import { site } from "@/core/site";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("page.pricing.metaTitle"), description: t("page.pricing.metaDescription") };
}

/** Billing-related questions, repeated here so the page answers what a visitor
 *  comparing plans actually asks before signing up. */
const BILLING_FAQ = [
  { q: "landing.faq.credits.q", a: "landing.faq.credits.a" },
  { q: "landing.faq.billing.q", a: "landing.faq.billing.a" },
] as const;

/**
 * `/tarifs` — the pricing cluster's landing page ("tarifs", "prix générateur
 * vidéo IA", "crédits"). The landing keeps a pricing section; this page is what
 * ranks for the intent, so it carries the offer structured data.
 */
export default async function PricingPage() {
  const t = await getT();
  const locale = await getLocale();

  // Offers come from the canonical tier matrix, so a price change in tiers.ts
  // can never leave the structured data claiming the old one.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: site.name,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web, iOS, Android",
    url: `${site.url}${localizedPath("/tarifs", locale)}`,
    offers: ORDERED_TIERS.map((plan) => {
      const tier = TIERS[plan];
      return {
        "@type": "Offer",
        name: tier.label,
        price: tier.priceEUR,
        priceCurrency: "EUR",
        category: tier.priceEUR === 0 ? "free" : "subscription",
      };
    }),
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <script
        type="application/ld+json"
        // Static, app-controlled data — safe to inline.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingHeader t={t} locale={locale} />
      <main className="flex-1">
        <section
          className="mx-auto w-full max-w-6xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-20"
          aria-labelledby="tarifs-h"
        >
          <div className="mb-14 flex max-w-2xl flex-col gap-5 sm:mb-20">
            <h1 id="tarifs-h" className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              {t("page.pricing.h1")}
            </h1>
            <p className="text-muted-foreground text-[17px] leading-relaxed">
              {t("page.pricing.intro")}
            </p>
          </div>
          <PricingCards t={t} />
        </section>

        <section
          className="mx-auto grid w-full max-w-6xl gap-x-12 gap-y-6 px-6 py-16 sm:py-20 lg:grid-cols-[1fr_1.5fr]"
          aria-labelledby="credits-h"
        >
          <h2 id="credits-h" className="text-3xl font-semibold tracking-[-0.03em]">
            {t("page.pricing.creditsTitle")}
          </h2>
          <p className="text-subtle-foreground text-[17px] leading-8">
            {t("landing.faq.credits.a")}
          </p>
        </section>

        <section
          className="mx-auto grid w-full max-w-6xl gap-x-12 gap-y-6 px-6 py-16 sm:py-20 lg:grid-cols-[1fr_1.5fr]"
          aria-labelledby="pricing-faq-h"
        >
          <h2 id="pricing-faq-h" className="text-3xl font-semibold tracking-[-0.03em]">
            {t("page.pricing.faqTitle")}
          </h2>
          <div>
            <FaqAccordion items={BILLING_FAQ.map((f) => ({ q: t(f.q), a: t(f.a) }))} />
            <p className="mt-6 text-[15px]">
              <Link
                href={localizedPath("/faq", locale)}
                className="text-foreground decoration-muted-foreground hover:decoration-foreground font-medium underline underline-offset-4"
              >
                {t("page.faq.h1")}
              </Link>
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pt-4 pb-20 sm:pb-28">
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div className="bg-card flex flex-col items-start gap-8 rounded-lg p-8 sm:p-12">
              <h2 className="max-w-md text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                {t("page.pricing.ctaTitle")}
              </h2>
              <TrackedLink
                href={localizedPath("/sign-in", locale)}
                location="pricing-page"
                className={buttonVariants({ size: "lg" })}
              >
                {t("landing.pricing.startFree")}
              </TrackedLink>
            </div>
            <div aria-hidden className="field-papier grain hidden min-h-56 rounded-lg lg:block" />
          </div>
        </section>
      </main>
      <MarketingFooter t={t} locale={locale} />
    </div>
  );
}
