import Link from "next/link";
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
        <section className="mx-auto w-full max-w-3xl px-6 py-16" aria-labelledby="faq-h">
          <h1 id="faq-h" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("page.faq.h1")}
          </h1>
          <p className="text-muted-foreground mt-3 leading-relaxed">{t("page.faq.intro")}</p>
          <div className="mt-10">
            <FaqAccordion items={items} />
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-6 pb-20">
          <div className="border-border rounded-lg border p-6">
            <h2 className="text-lg font-semibold tracking-tight">{t("page.faq.stillTitle")}</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {t("page.faq.stillBody")}
            </p>
            <p className="mt-4 text-sm">
              <a href="mailto:support@vidcica.com" className="hover:text-foreground underline">
                support@vidcica.com
              </a>
              <span className="text-muted-foreground"> · </span>
              <Link
                href={localizedPath("/tarifs", locale)}
                className="hover:text-foreground underline"
              >
                {t("landing.nav.pricing")}
              </Link>
            </p>
          </div>
        </section>
      </main>
      <MarketingFooter t={t} locale={locale} />
    </div>
  );
}
