import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/marketing-chrome";
import { TrackedLink } from "@/components/tracked-link";
import { getLocale, getT } from "@/lib/i18n/server";
import { localizedPath } from "@/lib/i18n/routing";
import { LOCALES } from "@/lib/i18n/config";
import { ARTICLES, findArticle } from "@/lib/marketing/blog";
import { site } from "@/core/site";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const article = findArticle(slug);
  const locale = await getLocale();
  const body = article?.content[locale];
  if (!body) return {};

  // hreflang is built from the locales this article was actually written in.
  // The root layout assumes every page exists in both; for the blog that is
  // false, and advertising the missing one would point Google at a 404.
  const available = LOCALES.filter((l) => article.content[l]);
  return {
    title: body.title,
    description: body.description,
    alternates: {
      canonical: localizedPath(`/blog/${slug}`, locale),
      languages: Object.fromEntries(available.map((l) => [l, localizedPath(`/blog/${slug}`, l)])),
    },
  };
}

/**
 * `/blog/<slug>` — one article. Returns 404 when the article exists but not in
 * this language, rather than silently falling back to the other one: a French
 * article served at an `/en` URL is worse than nothing, for readers and for
 * Google alike.
 */
export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = findArticle(slug);
  const locale = await getLocale();
  const body = article?.content[locale];
  if (!article || !body) notFound();

  const t = await getT();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: body.title,
    description: body.description,
    datePublished: article.published,
    inLanguage: locale,
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, url: site.url },
    mainEntityOfPage: `${site.url}${localizedPath(`/blog/${slug}`, locale)}`,
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
        <article className="mx-auto w-full max-w-2xl px-6 py-20 sm:py-28">
          <nav className="text-muted-foreground mb-8 text-[13px]" aria-label="Breadcrumb">
            <Link
              href={localizedPath("/blog", locale)}
              className="hover:text-foreground underline-offset-4 transition-colors hover:underline"
            >
              {t("page.blog.h1")}
            </Link>
          </nav>

          <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{body.title}</h1>
          <time
            className="text-muted-foreground mt-5 block text-[13px]"
            dateTime={article.published}
          >
            {new Date(article.published).toLocaleDateString(locale === "en" ? "en-CA" : "fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <p className="mt-10 text-xl leading-8">{body.intro}</p>

          {body.sections.map((s) => (
            <section key={s.h} className="mt-12">
              <h2 className="text-2xl font-semibold tracking-[-0.02em]">{s.h}</h2>
              <p className="text-subtle-foreground mt-4 text-[16px] leading-7">{s.p}</p>
            </section>
          ))}

          <aside className="bg-card mt-16 rounded-lg p-8">
            <p className="text-[17px] leading-7 font-medium">{body.outro}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <TrackedLink
                href={localizedPath("/sign-in", locale)}
                location={`blog:${slug}`}
                className={buttonVariants()}
              >
                {t("landing.pricing.startFree")}
              </TrackedLink>
              <Link
                href={localizedPath("/tarifs", locale)}
                className={buttonVariants({ variant: "ghost" })}
              >
                {t("landing.nav.pricing")}
              </Link>
            </div>
          </aside>
        </article>
      </main>
      <MarketingFooter t={t} locale={locale} />
    </div>
  );
}
