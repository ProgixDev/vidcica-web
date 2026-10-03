import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/marketing-chrome";
import { getLocale, getT } from "@/lib/i18n/server";
import { localizedPath } from "@/lib/i18n/routing";
import { USE_CASES } from "@/lib/marketing/use-cases";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("page.useCases.metaTitle"), description: t("page.useCases.metaDescription") };
}

/** `/cas-usage` — the hub that links the per-trade pages together, so each one
 *  is reachable from the nav in one hop rather than only from the sitemap. */
export default async function UseCasesPage() {
  const t = await getT();
  const locale = await getLocale();

  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingHeader t={t} locale={locale} />
      <main className="flex-1">
        <section
          className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28"
          aria-labelledby="usecases-h"
        >
          <div className="flex max-w-2xl flex-col gap-5">
            <h1 id="usecases-h" className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              {t("page.useCases.h1")}
            </h1>
            <p className="text-muted-foreground text-[17px] leading-relaxed">
              {t("page.useCases.intro")}
            </p>
          </div>
          <div className="mt-14 grid gap-4 sm:mt-20 sm:grid-cols-2">
            {USE_CASES.map((u) => (
              <Link
                key={u.slug}
                href={localizedPath(`/cas-usage/${u.slug}`, locale)}
                className="bg-card hover:bg-accent focus-visible:ring-ring focus-visible:ring-offset-background flex flex-col gap-3 rounded-lg p-8 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <h2 className="text-xl font-semibold tracking-[-0.02em]">{t(u.cardTitle)}</h2>
                <p className="text-muted-foreground text-[15px] leading-relaxed">{t(u.cardBody)}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <MarketingFooter t={t} locale={locale} />
    </div>
  );
}
