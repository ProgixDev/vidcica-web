import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/features/auth";
import { BrandLockup, LogoMark } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("auth.metaTitle") };
}

/**
 * Auth screen — identity 01. Desktop: the form column on the canvas (lockup,
 * «Bienvenue sur Vidcica», value line, form, legal footer) beside one
 * atmospheric field panel. Mobile: the form stands alone.
 */
export default async function SignInPage() {
  const t = await getT();
  // Already signed in (e.g. coming back after a Google OAuth round-trip) —
  // go straight to the app instead of showing the form again.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  return (
    <main className="bg-background grid min-h-dvh w-full lg:grid-cols-2">
      {/* Form column — on the canvas */}
      <div className="flex min-h-dvh flex-col px-6 py-5 sm:px-10">
        <div className="flex w-full items-center justify-between gap-3">
          <Link
            href="/"
            aria-label={t("auth.backHomeAria")}
            className="focus-visible:ring-ring focus-visible:ring-offset-background rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <BrandLockup />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              href="/"
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className: "hidden sm:inline-flex",
              })}
            >
              ← {t("auth.backToSite")}
            </Link>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <Reveal onMount y={18} className="flex w-full max-w-sm flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h1 className="text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-4xl">
                {t("auth.welcomeTitle")}
              </h1>
              <p
                className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px]"
                aria-label={t("auth.valueChipsAria")}
              >
                <span>{t("auth.chipAdvancedAi")}</span>
                <span aria-hidden>·</span>
                <span>{t("auth.chipMultiNetwork")}</span>
                <span aria-hidden>·</span>
                <span>{t("auth.chipAnalytics")}</span>
              </p>
            </div>

            <Suspense>
              <AuthPanel />
            </Suspense>

            <p className="text-muted-foreground text-xs leading-relaxed">
              {t("auth.legalPrefix")}{" "}
              <Link href="/terms" className="hover:text-foreground underline underline-offset-2">
                {t("auth.legalTerms")}
              </Link>{" "}
              {t("auth.legalAnd")}{" "}
              <Link href="/privacy" className="hover:text-foreground underline underline-offset-2">
                {t("auth.legalPrivacy")}
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </div>

      {/* Atmospheric panel — desktop only. The field runs dark (bottom-left) to
          pale in dark mode and is pale throughout in light mode, so the mark and
          tagline sit bottom-left where `text-foreground` contrasts in both. */}
      <div className="hidden p-3 lg:block">
        <div className="field-contre-jour grain text-foreground sticky top-3 flex h-[calc(100dvh-1.5rem)] flex-col justify-end rounded-lg p-12">
          <LogoMark className="size-20" />
          <p className="mt-8 max-w-sm text-2xl leading-snug font-semibold tracking-[-0.03em]">
            {t("about.tagline")}
          </p>
        </div>
      </div>
    </main>
  );
}
