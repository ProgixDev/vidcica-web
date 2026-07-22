import Link from "next/link";
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
    <main className="mx-auto min-h-dvh w-full max-w-[720px] px-5 py-10 pb-20">
      <Link href="/" className="text-primary text-lg font-bold tracking-tight">
        Vidcica
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">{t("legal.pageTitle")}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{t("legal.lastUpdated")}</p>
      <div className="mt-8 flex flex-col gap-8">
        <section>
          <h2 className="text-base font-semibold">{t("legal.editor.title")}</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("legal.editor.body")}
            <br />
            {t("legal.editor.director")}
            <br />
            {t("legal.editor.contact")}{" "}
            <a href="mailto:support@vidcica.com" className="text-primary hover:underline">
              support@vidcica.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">{t("legal.hosting.title")}</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("legal.hosting.body")}
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">{t("legal.ip.title")}</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("legal.ip.body")}{" "}
            <Link href="/terms" className="text-primary hover:underline">
              {t("legal.ip.termsLink")}
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">{t("legal.data.title")}</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("legal.data.body1")}{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              {t("legal.data.privacyLink")}
            </Link>
            {t("legal.data.body2")}{" "}
            <a href="mailto:support@vidcica.com" className="text-primary hover:underline">
              support@vidcica.com
            </a>
            .
          </p>
        </section>
      </div>
      <footer className="text-muted-foreground mt-12 border-t pt-4 text-xs">
        <Link href="/" className="hover:text-foreground">
          {t("legal.backHome")}
        </Link>
      </footer>
    </main>
  );
}
