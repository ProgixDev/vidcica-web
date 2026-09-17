import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeaderCta } from "@/components/header-cta";
import { localizedPath } from "@/lib/i18n/routing";
import type { Locale, TFunction } from "@/lib/i18n";

/**
 * Header + footer shared by every public marketing page.
 *
 * Extracted from the landing page so `/tarifs`, `/faq` and the pages that follow
 * carry the same chrome — and, more to the point, so the nav links between them
 * are real crawlable links rather than on-page anchors.
 *
 * Every internal href goes through `localizedPath`, or an English reader would
 * be dropped back into French the moment they used the nav.
 */

type ChromeProps = { t: TFunction; locale: Locale };

/** Marketing nav targets, in order. Anchors stay for the landing's own sections. */
function navLinks(t: TFunction, locale: Locale) {
  return [
    { href: `${localizedPath("/", locale)}#exemples`, label: t("landing.nav.examples") },
    { href: localizedPath("/fonctionnalites", locale), label: t("landing.nav.features") },
    { href: localizedPath("/tarifs", locale), label: t("landing.nav.pricing") },
    { href: localizedPath("/faq", locale), label: "FAQ" },
  ];
}

export function MarketingHeader({ t, locale }: ChromeProps) {
  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
        <Link href={localizedPath("/", locale)} aria-label={t("landing.nav.homeAria")}>
          <BrandLockup />
        </Link>
        <nav className="text-muted-foreground hidden items-center gap-6 text-sm md:flex">
          {navLinks(t, locale).map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <Link
            href={localizedPath("/sign-in", locale)}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden rounded-full sm:inline-flex",
            )}
          >
            {t("landing.nav.signIn")}
          </Link>
          <HeaderCta />
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter({ t, locale }: ChromeProps) {
  const link = (path: string) => localizedPath(path, locale);
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <div className="flex flex-wrap items-start justify-between gap-10">
          <div className="flex max-w-xs flex-col gap-3">
            <BrandLockup />
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("landing.footer.tagline")}
            </p>
          </div>
          <nav
            className="flex flex-wrap gap-x-16 gap-y-8 text-sm"
            aria-label={t("landing.footer.aria")}
          >
            <div className="flex flex-col gap-3">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {t("landing.footer.product")}
              </span>
              <Link
                href={`${link("/")}#exemples`}
                className="hover:text-foreground text-muted-foreground"
              >
                {t("landing.nav.examples")}
              </Link>
              <Link
                href={link("/fonctionnalites")}
                className="hover:text-foreground text-muted-foreground"
              >
                {t("landing.nav.features")}
              </Link>
              <Link href={link("/tarifs")} className="hover:text-foreground text-muted-foreground">
                {t("landing.nav.pricing")}
              </Link>
              <Link href={link("/faq")} className="hover:text-foreground text-muted-foreground">
                FAQ
              </Link>
              <Link href={link("/sign-in")} className="hover:text-foreground text-muted-foreground">
                {t("landing.nav.signIn")}
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {t("landing.footer.legal")}
              </span>
              {/* Legal pages are one bilingual document each — never locale-prefixed. */}
              <Link href="/privacy" className="hover:text-foreground text-muted-foreground">
                {t("landing.footer.privacy")}
              </Link>
              <Link href="/terms" className="hover:text-foreground text-muted-foreground">
                {t("landing.footer.terms")}
              </Link>
              <Link
                href={link("/mentions-legales")}
                className="hover:text-foreground text-muted-foreground"
              >
                {t("landing.footer.legalNotice")}
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {t("landing.footer.contact")}
              </span>
              <a
                href="mailto:support@vidcica.com"
                className="hover:text-foreground text-muted-foreground"
              >
                support@vidcica.com
              </a>
            </div>
          </nav>
        </div>
        <p className="text-muted-foreground/70 text-xs">{t("landing.footer.copyright")}</p>
      </div>
    </footer>
  );
}
