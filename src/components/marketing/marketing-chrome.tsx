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
    { href: localizedPath("/blog", locale), label: t("landing.nav.blog") },
  ];
}

export function MarketingHeader({ t, locale }: ChromeProps) {
  return (
    <header className="bg-background sticky top-0 z-40">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href={localizedPath("/", locale)} aria-label={t("landing.nav.homeAria")}>
          <BrandLockup />
        </Link>
        <nav className="text-muted-foreground hidden items-center gap-7 text-sm font-medium md:flex">
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
            className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex")}
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
    <footer className="bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-16">
        <div className="flex flex-wrap items-start justify-between gap-10">
          <div className="flex max-w-xs flex-col gap-3">
            <BrandLockup />
            <p className="text-muted-foreground text-[15px] leading-relaxed">
              {t("landing.footer.tagline")}
            </p>
          </div>
          <nav
            className="flex flex-wrap gap-x-16 gap-y-8 text-sm"
            aria-label={t("landing.footer.aria")}
          >
            <div className="flex flex-col gap-3">
              <span className="text-foreground text-[13px] font-semibold">
                {t("landing.footer.product")}
              </span>
              <Link
                href={`${link("/")}#exemples`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("landing.nav.examples")}
              </Link>
              <Link
                href={link("/fonctionnalites")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("landing.nav.features")}
              </Link>
              <Link
                href={link("/tarifs")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("landing.nav.pricing")}
              </Link>
              <Link
                href={link("/faq")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </Link>
              <Link
                href={link("/blog")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("landing.nav.blog")}
              </Link>
              <Link
                href={link("/sign-in")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("landing.nav.signIn")}
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-foreground text-[13px] font-semibold">
                {t("landing.footer.legal")}
              </span>
              {/* Legal pages are one bilingual document each — never locale-prefixed. */}
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("landing.footer.privacy")}
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("landing.footer.terms")}
              </Link>
              <Link
                href={link("/mentions-legales")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("landing.footer.legalNotice")}
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-foreground text-[13px] font-semibold">
                {t("landing.footer.contact")}
              </span>
              <a
                href="mailto:support@vidcica.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                support@vidcica.com
              </a>
            </div>
          </nav>
        </div>
        <p className="text-muted-foreground text-[13px]">{t("landing.footer.copyright")}</p>
      </div>
    </footer>
  );
}
