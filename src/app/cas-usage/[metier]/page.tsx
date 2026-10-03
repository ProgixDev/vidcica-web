import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/marketing-chrome";
import { TrackedLink } from "@/components/tracked-link";
import { getLocale, getT } from "@/lib/i18n/server";
import { localizedPath } from "@/lib/i18n/routing";
import { USE_CASES, findUseCase } from "@/lib/marketing/use-cases";
import { site } from "@/core/site";

type Params = { params: Promise<{ metier: string }> };

/** Pre-declare the trades so the router treats anything else as a 404 rather
 *  than rendering an empty shell for /cas-usage/<anything>. */
export function generateStaticParams() {
  return USE_CASES.map((u) => ({ metier: u.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params) {
  const { metier } = await params;
  const useCase = findUseCase(metier);
  if (!useCase) return {};
  const t = await getT();
  return { title: t(useCase.metaTitle), description: t(useCase.metaDescription) };
}

/**
 * `/cas-usage/<métier>` — one page per trade. Each targets its own search
 * ("vidéo réseaux sociaux restaurant", "vidéo immobilier réseaux sociaux"),
 * which a single generic page cannot rank for.
 */
export default async function UseCasePage({ params }: Params) {
  const { metier } = await params;
  const useCase = findUseCase(metier);
  if (!useCase) notFound();

  const t = await getT();
  const locale = await getLocale();
  const others = USE_CASES.filter((u) => u.slug !== useCase.slug);

  // Breadcrumbs give Google the hierarchy (home → cas d'usage → this trade)
  // instead of leaving each page looking like an orphan.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: site.name,
        item: `${site.url}${localizedPath("/", locale)}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("page.useCases.h1"),
        item: `${site.url}${localizedPath("/cas-usage", locale)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: t(useCase.cardTitle),
        item: `${site.url}${localizedPath(`/cas-usage/${useCase.slug}`, locale)}`,
      },
    ],
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
          aria-labelledby="usecase-h"
        >
          <nav className="text-muted-foreground mb-8 text-[13px]" aria-label="Breadcrumb">
            <Link
              href={localizedPath("/cas-usage", locale)}
              className="hover:text-foreground underline-offset-4 transition-colors hover:underline"
            >
              {t("page.useCases.h1")}
            </Link>
            <span aria-hidden> / </span>
            <span>{t(useCase.cardTitle)}</span>
          </nav>

          <div className="flex max-w-3xl flex-col gap-5">
            <h1 id="usecase-h" className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              {t(useCase.h1)}
            </h1>
            <p className="text-muted-foreground text-[17px] leading-relaxed">{t(useCase.intro)}</p>
          </div>

          <div className="mt-16 grid gap-x-12 gap-y-6 sm:mt-24 lg:grid-cols-[1fr_1.6fr]">
            <h2 className="text-3xl font-semibold tracking-[-0.03em]">
              {t("page.useCases.ideasTitle")}
            </h2>
            <ol className="bg-card divide-border flex flex-col divide-y rounded-lg px-6 sm:px-8">
              {useCase.ideas.map((idea, i) => (
                <li key={idea} className="flex items-baseline gap-5 py-5">
                  <span aria-hidden className="text-muted-foreground text-[13px] tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] leading-relaxed">{t(idea)}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6">
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div className="bg-card flex flex-col items-start gap-8 rounded-lg p-8 sm:p-12">
              <p className="max-w-md text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                {t("page.pricing.ctaTitle")}
              </p>
              <div className="flex flex-wrap gap-3">
                <TrackedLink
                  href={localizedPath("/sign-in", locale)}
                  location={`use-case:${useCase.slug}`}
                  className={buttonVariants({ variant: "brand", size: "lg" })}
                >
                  {t("landing.pricing.startFree")}
                </TrackedLink>
                <Link
                  href={localizedPath("/tarifs", locale)}
                  className={buttonVariants({ variant: "ghost", size: "lg" })}
                >
                  {t("landing.nav.pricing")}
                </Link>
              </div>
            </div>
            <div
              aria-hidden
              className="field-contre-jour grain hidden min-h-56 rounded-lg lg:block"
            />
          </div>
        </section>

        <section
          className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20"
          aria-labelledby="others-h"
        >
          <h2 id="others-h" className="text-xl font-semibold tracking-[-0.02em]">
            {t("page.useCases.otherTitle")}
          </h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {others.map((u) => (
              <li key={u.slug}>
                <Link
                  href={localizedPath(`/cas-usage/${u.slug}`, locale)}
                  className={buttonVariants({ variant: "secondary" })}
                >
                  {t(u.cardTitle)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <MarketingFooter t={t} locale={locale} />
    </div>
  );
}
