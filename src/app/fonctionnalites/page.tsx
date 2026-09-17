import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/marketing-chrome";
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
        <section className="mx-auto w-full max-w-6xl px-6 py-16" aria-labelledby="features-h">
          <div className="mb-12 flex max-w-2xl flex-col gap-3">
            <h1 id="features-h" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("page.features.h1")}
            </h1>
            <p className="text-muted-foreground leading-relaxed">{t("page.features.intro")}</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.title} className="flex flex-col gap-3">
                <FeatureIcon path={f.icon.path} circles={f.icon.circles} />
                <h2 className="text-base font-semibold tracking-tight">{t(f.title)}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{t(f.body)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-secondary/40 border-y">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-16 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">{t("page.pricing.ctaTitle")}</h2>
            <div className="flex flex-wrap justify-center gap-3">
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
          </div>
        </section>
      </main>
      <MarketingFooter t={t} locale={locale} />
    </div>
  );
}
