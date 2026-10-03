import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/marketing-chrome";
import { TrackedLink } from "@/components/tracked-link";
import { FeatureIcon } from "@/components/marketing/feature-icon";
import { getLocale, getT } from "@/lib/i18n/server";
import { localizedPath } from "@/lib/i18n/routing";
import { FEATURES } from "@/lib/marketing/features";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("page.features.metaTitle"), description: t("page.features.metaDescription") };
}

/**
 * `/fonctionnalites` — the hub for the feature cluster (script IA, voix off,
 * sous-titres, musique, publication, campagnes). Each card is a heading of its
 * own so the page can be split into one page per feature later without moving
 * the copy again.
 */
export default async function FeaturesPage() {
  const t = await getT();
  const locale = await getLocale();

  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingHeader t={t} locale={locale} />
      <main className="flex-1">
        <section
          className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28"
          aria-labelledby="features-h"
        >
          <div className="flex max-w-2xl flex-col gap-5">
            <h1 id="features-h" className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              {t("page.features.h1")}
            </h1>
            <p className="text-muted-foreground text-[17px] leading-relaxed">
              {t("page.features.intro")}
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.title} className="bg-card flex flex-col rounded-lg p-8">
                <span className="text-foreground">
                  <FeatureIcon path={f.icon.path} circles={f.icon.circles} />
                </span>
                <h2 className="mt-10 text-[17px] font-semibold tracking-[-0.01em]">{t(f.title)}</h2>
                <p className="text-muted-foreground mt-2 text-[15px] leading-relaxed">
                  {t(f.body)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-20 sm:pb-28">
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div className="bg-card flex flex-col items-start gap-8 rounded-lg p-8 sm:p-12">
              <h2 className="max-w-md text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                {t("page.pricing.ctaTitle")}
              </h2>
              <div className="flex flex-wrap gap-3">
                <TrackedLink
                  href={localizedPath("/sign-in", locale)}
                  location="features"
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
            <div aria-hidden className="field-aube grain hidden min-h-56 rounded-lg lg:block" />
          </div>
        </section>
      </main>
      <MarketingFooter t={t} locale={locale} />
    </div>
  );
}
