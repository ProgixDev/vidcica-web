import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/marketing-chrome";
import { getLocale, getT } from "@/lib/i18n/server";
import { localizedPath } from "@/lib/i18n/routing";
import { articlesFor } from "@/lib/marketing/blog";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("page.blog.metaTitle"), description: t("page.blog.metaDescription") };
}

/** `/blog` — the index. Lists only the articles written in the active language;
 *  the two markets do not share every topic. */
export default async function BlogIndexPage() {
  const t = await getT();
  const locale = await getLocale();
  const articles = articlesFor(locale);

  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingHeader t={t} locale={locale} />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-3xl px-6 py-16" aria-labelledby="blog-h">
          <h1 id="blog-h" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("page.blog.h1")}
          </h1>
          <p className="text-muted-foreground mt-3 leading-relaxed">{t("page.blog.intro")}</p>

          <ul className="mt-10 flex flex-col gap-4">
            {articles.map((a) => {
              const body = a.content[locale]!;
              return (
                <li key={a.slug}>
                  <Link
                    href={localizedPath(`/blog/${a.slug}`, locale)}
                    className="border-border hover:border-primary/60 block rounded-lg border p-6 transition-colors"
                  >
                    <h2 className="text-lg font-semibold tracking-tight">{body.title}</h2>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      {body.description}
                    </p>
                    <time
                      className="text-muted-foreground/70 mt-3 block text-xs"
                      dateTime={a.published}
                    >
                      {new Date(a.published).toLocaleDateString(
                        locale === "en" ? "en-CA" : "fr-FR",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </time>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
      <MarketingFooter t={t} locale={locale} />
    </div>
  );
}
