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
        <section className="mx-auto w-full max-w-6xl px-6 py-16" aria-labelledby="usecases-h">
          <div className="mb-12 flex max-w-2xl flex-col gap-3">
            <h1 id="usecases-h" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("page.useCases.h1")}
            </h1>
            <p className="text-muted-foreground leading-relaxed">{t("page.useCases.intro")}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {USE_CASES.map((u) => (
              <Link
                key={u.slug}
                href={localizedPath(`/cas-usage/${u.slug}`, locale)}
                className="border-border hover:border-primary/60 flex flex-col gap-2 rounded-lg border p-6 transition-colors"
              >
                <h2 className="text-base font-semibold tracking-tight">{t(u.cardTitle)}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{t(u.cardBody)}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <MarketingFooter t={t} locale={locale} />
    </div>
  );
}
