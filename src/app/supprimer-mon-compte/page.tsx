import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t("legal.delete.metaTitle"),
    description: t("legal.delete.metaDescription"),
  };
}

/**
 * Public account-deletion instructions — required by the Google Play Data safety
 * section (a web URL that names the app, gives the deletion steps, and states
 * what is deleted/kept + retention). Localized (FR/EN) via i18n; public (not auth-gated).
 */
export default async function DeleteAccountPage() {
  const t = await getT();
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[720px] px-5 py-10 pb-20">
      <Link href="/" className="text-primary text-lg font-bold tracking-tight">
        Vidcica
      </Link>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight">{t("legal.delete.title")}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{t("legal.lastUpdated")}</p>

      <div className="mt-8 flex flex-col gap-8">
        <section>
          <h2 className="text-base font-semibold">{t("legal.delete.fromApp.title")}</h2>
          <ol className="text-muted-foreground mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed">
            <li>{t("legal.delete.fromApp.step1")}</li>
            <li>
              {t("legal.delete.fromApp.step2")}{" "}
              <strong>{t("legal.delete.fromApp.step2Path")}</strong>.
            </li>
            <li>{t("legal.delete.fromApp.step3")}</li>
          </ol>
        </section>

        <section>
          <h2 className="text-base font-semibold">{t("legal.delete.byEmail.title")}</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("legal.delete.byEmail.body1")}{" "}
            <a href="mailto:support@vidcica.com" className="text-primary hover:underline">
              support@vidcica.com
            </a>{" "}
            {t("legal.delete.byEmail.body2")}
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">{t("legal.delete.whatDeleted.title")}</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("legal.delete.whatDeleted.body")}
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("legal.delete.whatDeleted.partial1")}{" "}
            <strong>{t("legal.delete.whatDeleted.partialStrong")}</strong>{" "}
            {t("legal.delete.whatDeleted.partial2")}{" "}
            <a href="mailto:support@vidcica.com" className="text-primary hover:underline">
              support@vidcica.com
            </a>{" "}
            {t("legal.delete.whatDeleted.partial3")}
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">{t("legal.delete.timing.title")}</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("legal.delete.timing.body1a")}{" "}
            <strong>{t("legal.delete.timing.body1Strong")}</strong>
            {t("legal.delete.timing.body1b")}{" "}
            <strong>{t("legal.delete.timing.body1Strong2")}</strong>.
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            <strong>{t("legal.delete.timing.retentionStrong")}</strong>{" "}
            {t("legal.delete.timing.retentionBody")}
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
