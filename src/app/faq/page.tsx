import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { FaqAccordion } from "@/components/faq-accordion";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/marketing-chrome";
import { getLocale, getT } from "@/lib/i18n/server";
import { localizedPath } from "@/lib/i18n/routing";
import { FAQ_ITEMS } from "@/lib/marketing/faq";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("page.faq.metaTitle"), description: t("page.faq.metaDescription") };
}

/**
 * `/faq` — owns the question-shaped searches ("comment fonctionnent les
 * crédits", "sur quels réseaux publier"). The FAQ structured data lives here
 * rather than on the landing page: the same FAQPage markup on two URLs asks
 * Google to pick between them, which is the cannibalisation this split exists
 * to avoid.
 */
export default async function FaqPage() {
  const t = await getT();
  const locale = await getLocale();
  const items = FAQ_ITEMS.map((f) => ({ q: t(f.q), a: t(f.a) }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
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
          className="mx-auto grid w-full max-w-6xl gap-x-12 gap-y-12 px-6 py-20 sm:py-28 lg:grid-cols-[1fr_1.5fr]"
          aria-labelledby="faq-h"
        >
          <div className="flex flex-col gap-5 lg:sticky lg:top-28 lg:self-start">
            <h1 id="faq-h" className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              {t("page.faq.h1")}
            </h1>
            <p className="text-muted-foreground max-w-md text-[17px] leading-relaxed">
              {t("page.faq.intro")}
            </p>
          </div>
          <FaqAccordion items={items} />
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-20 sm:pb-28">
          <div className="bg-card flex flex-col gap-6 rounded-lg p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold tracking-[-0.02em]">
                {t("page.faq.stillTitle")}
              </h2>
              <p className="text-muted-foreground text-[15px] leading-relaxed">
                {t("page.faq.stillBody")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="mailto:support@vidcica.com" className={buttonVariants()}>
                support@vidcica.com
              </a>
              <Link
                href={localizedPath("/tarifs", locale)}
                className={buttonVariants({ variant: "ghost" })}
              >
                {t("landing.nav.pricing")}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter t={t} locale={locale} />
    </div>
  );
}
