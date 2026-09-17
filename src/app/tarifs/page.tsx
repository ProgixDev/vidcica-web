import Link from "next/link";
import { cn } from "@/lib/utils";
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
        <section className="mx-auto w-full max-w-6xl px-6 py-16" aria-labelledby="tarifs-h">
          <div className="mb-10 flex max-w-2xl flex-col gap-3">
            <h1 id="tarifs-h" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("page.pricing.h1")}
            </h1>
            <p className="text-muted-foreground leading-relaxed">{t("page.pricing.intro")}</p>
          </div>
          <PricingCards t={t} />
        </section>

        <section className="bg-secondary/40 border-y" aria-labelledby="credits-h">
          <div className="mx-auto w-full max-w-3xl px-6 py-16">
            <h2 id="credits-h" className="text-xl font-semibold tracking-tight sm:text-2xl">
              {t("page.pricing.creditsTitle")}
            </h2>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              {t("landing.faq.credits.a")}
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-6 py-16" aria-labelledby="pricing-faq-h">
          <h2 id="pricing-faq-h" className="mb-6 text-xl font-semibold tracking-tight sm:text-2xl">
            {t("page.pricing.faqTitle")}
          </h2>
          <FaqAccordion items={BILLING_FAQ.map((f) => ({ q: t(f.q), a: t(f.a) }))} />
          <p className="text-muted-foreground mt-6 text-sm">
            <Link href={localizedPath("/faq", locale)} className="hover:text-foreground underline">
              {t("page.faq.h1")}
            </Link>
          </p>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">{t("page.pricing.ctaTitle")}</h2>
          <div className="mt-6 flex justify-center">
            <TrackedLink
              href={localizedPath("/sign-in", locale)}
              location="pricing-page"
              className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8")}
            >
              {t("landing.pricing.startFree")}
            </TrackedLink>
          </div>
        </section>
      </main>
      <MarketingFooter t={t} locale={locale} />
    </div>
  );
}
