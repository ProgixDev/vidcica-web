import Link from "next/link";
import { BrandLockup } from "@/components/brand";
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
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-6 pt-10 pb-24">
      <Link
        href="/"
        className="focus-visible:ring-ring focus-visible:ring-offset-background inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <BrandLockup />
      </Link>

      <h1 className="mt-16 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
        {t("legal.delete.title")}
      </h1>
      <p className="text-muted-foreground mt-4 text-[13px]">{t("legal.lastUpdated")}</p>

      <div className="mt-14 flex flex-col gap-12">
        <section>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">
            {t("legal.delete.fromApp.title")}
          </h2>
          <ol className="text-subtle-foreground mt-3 flex list-decimal flex-col gap-2 pl-5 text-[16px] leading-7">
            <li>{t("legal.delete.fromApp.step1")}</li>
            <li>
              {t("legal.delete.fromApp.step2")}{" "}
              <strong className="text-foreground font-semibold">
                {t("legal.delete.fromApp.step2Path")}
              </strong>
              .
            </li>
            <li>{t("legal.delete.fromApp.step3")}</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">
            {t("legal.delete.byEmail.title")}
          </h2>
          <p className="text-subtle-foreground mt-3 text-[16px] leading-7">
            {t("legal.delete.byEmail.body1")}{" "}
            <a
              href="mailto:support@vidcica.com"
              className="text-foreground font-medium underline underline-offset-4"
            >
              support@vidcica.com
            </a>{" "}
            {t("legal.delete.byEmail.body2")}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">
            {t("legal.delete.whatDeleted.title")}
          </h2>
          <p className="text-subtle-foreground mt-3 text-[16px] leading-7">
            {t("legal.delete.whatDeleted.body")}
          </p>
          <p className="text-subtle-foreground mt-3 text-[16px] leading-7">
            {t("legal.delete.whatDeleted.partial1")}{" "}
            <strong className="text-foreground font-semibold">
              {t("legal.delete.whatDeleted.partialStrong")}
            </strong>{" "}
            {t("legal.delete.whatDeleted.partial2")}{" "}
            <a
              href="mailto:support@vidcica.com"
              className="text-foreground font-medium underline underline-offset-4"
            >
              support@vidcica.com
            </a>{" "}
            {t("legal.delete.whatDeleted.partial3")}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">
            {t("legal.delete.timing.title")}
          </h2>
          <p className="text-subtle-foreground mt-3 text-[16px] leading-7">
            {t("legal.delete.timing.body1a")}{" "}
            <strong className="text-foreground font-semibold">
              {t("legal.delete.timing.body1Strong")}
            </strong>
            {t("legal.delete.timing.body1b")}{" "}
            <strong className="text-foreground font-semibold">
              {t("legal.delete.timing.body1Strong2")}
            </strong>
            .
          </p>
          <p className="text-subtle-foreground mt-3 text-[16px] leading-7">
            <strong className="text-foreground font-semibold">
              {t("legal.delete.timing.retentionStrong")}
            </strong>{" "}
            {t("legal.delete.timing.retentionBody")}
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
