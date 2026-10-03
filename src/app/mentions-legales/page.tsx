import Link from "next/link";
import { BrandLockup } from "@/components/brand";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t("legal.metaTitle"),
    description: t("legal.metaDescription"),
  };
}

export default async function MentionsLegalesPage() {
  const t = await getT();
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-6 pt-10 pb-24">
      <Link
        href="/"
        className="focus-visible:ring-ring focus-visible:ring-offset-background inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <BrandLockup />
      </Link>
      <h1 className="mt-16 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
        {t("legal.pageTitle")}
      </h1>
      <p className="text-muted-foreground mt-4 text-[13px]">{t("legal.lastUpdated")}</p>
      <div className="mt-14 flex flex-col gap-12">
        <section>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">{t("legal.editor.title")}</h2>
          <p className="text-subtle-foreground mt-3 text-[16px] leading-7">
            {t("legal.editor.body")}
            <br />
            {t("legal.editor.director")}
            <br />
            {t("legal.editor.contact")}{" "}
            <a
              href="mailto:support@vidcica.com"
              className="text-foreground font-medium underline underline-offset-4"
            >
              support@vidcica.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">{t("legal.hosting.title")}</h2>
          <p className="text-subtle-foreground mt-3 text-[16px] leading-7">
            {t("legal.hosting.body")}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">{t("legal.ip.title")}</h2>
          <p className="text-subtle-foreground mt-3 text-[16px] leading-7">
            {t("legal.ip.body")}{" "}
            <Link
              href="/terms"
              className="text-foreground font-medium underline underline-offset-4"
            >
              {t("legal.ip.termsLink")}
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">{t("legal.data.title")}</h2>
          <p className="text-subtle-foreground mt-3 text-[16px] leading-7">
            {t("legal.data.body1")}{" "}
            <Link
              href="/privacy"
              className="text-foreground font-medium underline underline-offset-4"
            >
              {t("legal.data.privacyLink")}
            </Link>
            {t("legal.data.body2")}{" "}
            <a
              href="mailto:support@vidcica.com"
              className="text-foreground font-medium underline underline-offset-4"
            >
              support@vidcica.com
            </a>
            .
          </p>
        </section>
      </div>
      <footer className="text-muted-foreground mt-20 text-[13px]">
        <Link href="/" className="hover:text-foreground transition-colors">
          {t("legal.backHome")}
        </Link>
      </footer>
    </main>
  );
}
