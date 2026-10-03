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
        <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28" aria-labelledby="blog-h">
          <div className="flex max-w-2xl flex-col gap-5">
            <h1 id="blog-h" className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              {t("page.blog.h1")}
            </h1>
            <p className="text-muted-foreground text-[17px] leading-relaxed">
              {t("page.blog.intro")}
            </p>
          </div>

          <ul className="divide-border mt-14 flex max-w-3xl flex-col divide-y sm:mt-20">
            {articles.map((a) => {
              const body = a.content[locale]!;
              return (
                <li key={a.slug}>
                  <Link
                    href={localizedPath(`/blog/${a.slug}`, locale)}
                    className="group focus-visible:ring-ring focus-visible:ring-offset-background flex flex-col gap-3 rounded-sm py-8 outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  >
                    <time className="text-muted-foreground text-[13px]" dateTime={a.published}>
                      {new Date(a.published).toLocaleDateString(
                        locale === "en" ? "en-CA" : "fr-FR",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </time>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] underline-offset-4 group-hover:underline">
                      {body.title}
                    </h2>
                    <p className="text-muted-foreground text-[15px] leading-relaxed">
                      {body.description}
                    </p>
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
