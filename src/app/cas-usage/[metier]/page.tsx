import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/marketing-chrome";
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
        <section className="mx-auto w-full max-w-3xl px-6 py-16" aria-labelledby="usecase-h">
          <nav className="text-muted-foreground mb-6 text-sm" aria-label="Breadcrumb">
            <Link href={localizedPath("/cas-usage", locale)} className="hover:text-foreground">
              {t("page.useCases.h1")}
            </Link>
            <span aria-hidden> / </span>
            <span>{t(useCase.cardTitle)}</span>
          </nav>

          <h1 id="usecase-h" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t(useCase.h1)}
          </h1>
          <p className="text-muted-foreground mt-4 leading-relaxed">{t(useCase.intro)}</p>

          <h2 className="mt-12 text-xl font-semibold tracking-tight">
            {t("page.useCases.ideasTitle")}
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {useCase.ideas.map((idea) => (
              <li key={idea} className="border-border flex gap-3 rounded-lg border p-4 text-sm">
                <span aria-hidden className="text-primary">
                  →
                </span>
                <span>{t(idea)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={localizedPath("/sign-in", locale)}
              className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8")}
            >
              {t("landing.pricing.startFree")}
            </Link>
            <Link
              href={localizedPath("/tarifs", locale)}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "rounded-full px-8",
              )}
            >
              {t("landing.nav.pricing")}
            </Link>
          </div>
        </section>

        <section className="bg-secondary/40 border-t" aria-labelledby="others-h">
          <div className="mx-auto w-full max-w-3xl px-6 py-14">
            <h2 id="others-h" className="text-lg font-semibold tracking-tight">
              {t("page.useCases.otherTitle")}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-3 text-sm">
              {others.map((u) => (
                <li key={u.slug}>
                  <Link
                    href={localizedPath(`/cas-usage/${u.slug}`, locale)}
                    className="border-border hover:border-primary/60 inline-flex rounded-full border px-4 py-2 transition-colors"
                  >
                    {t(u.cardTitle)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <MarketingFooter t={t} locale={locale} />
    </div>
  );
}
