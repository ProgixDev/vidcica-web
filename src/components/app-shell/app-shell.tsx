"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "@/components/motion";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useT } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { CreditsChip } from "./credits-chip";
import { ShellIcon, type IconName } from "./icons";

/**
 * Authenticated app shell — the web counterpart of the mobile app's floating
 * tab bar: same destinations (Accueil / Vidéos / Réseaux / Profil) plus the
 * web-only feature pages, a persistent «Créer une vidéo» CTA and a live
 * credits gauge. Sidebar on desktop, top bar + drawer on mobile.
 *
 * Feature widgets (notification bell…) are injected as slots by the layout —
 * the shared tier never imports from features (module boundaries).
 */
type NavItem = { href: string; labelKey: MessageKey; icon: IconName };

const NAV_MAIN: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.home", icon: "home" },
  { href: "/videos", labelKey: "nav.videos", icon: "film" },
  { href: "/networks", labelKey: "nav.networks", icon: "share" },
  { href: "/ads", labelKey: "nav.ads", icon: "megaphone" },
  { href: "/leads", labelKey: "nav.leads", icon: "users" },
  { href: "/analytics", labelKey: "nav.analytics", icon: "chart" },
];

const NAV_SECONDARY: NavItem[] = [
  { href: "/billing", labelKey: "nav.billing", icon: "card" },
  { href: "/support", labelKey: "nav.support", icon: "lifebuoy" },
  { href: "/account", labelKey: "nav.account", icon: "user" },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const t = useT();
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      data-testid={`shell-nav-${item.href.slice(1)}`}
      className={cn(
        "flex h-10 items-center gap-3 rounded-full px-3.5 text-sm transition-colors",
        active
          ? "bg-secondary text-foreground font-semibold"
          : "text-muted-foreground hover:text-foreground font-medium",
      )}
    >
      <ShellIcon name={item.icon} className="size-5 shrink-0" />
      {t(item.labelKey)}
    </Link>
  );
}

function NavSections({ pathname }: { pathname: string }) {
  const t = useT();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return (
    <nav className="flex flex-1 flex-col gap-6" aria-label={t("shell.mainNav")}>
      <div className="flex flex-col gap-1">
        {NAV_MAIN.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground px-3.5 pb-1 text-xs font-medium">
          {t("nav.sectionAccount")}
        </span>
        {NAV_SECONDARY.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </div>
    </nav>
  );
}

export function AppShell({
  userId,
  email,
  planLabel,
  credits,
  monthlyCredits,
  bell,
  children,
}: {
  userId: string;
  email: string;
  planLabel: string;
  credits: number;
  monthlyCredits: number;
  /** Slot for the notifications bell (a feature component, injected by the layout). */
  bell?: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = useT();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Navigating closes the drawer — adjust during render (no effect, no
  // cascading-render lint) using the previous-value pattern.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setDrawerOpen(false);
  }

  const initial = (email[0] ?? "?").toUpperCase();

  const sidebarBody = (
    <>
      <Link href="/dashboard" aria-label={t("shell.home")} className="px-3.5 pt-1">
        <BrandLockup />
      </Link>
      <Link
        href="/create"
        data-testid="shell-create-cta"
        className={buttonVariants({ variant: "brand", size: "lg" })}
      >
        <ShellIcon name="sparkle" className="size-4" />
        {t("shell.createCta")}
      </Link>
      <NavSections pathname={pathname} />
      <CreditsChip
        userId={userId}
        initial={credits}
        monthlyCredits={monthlyCredits}
        variant="card"
      />
      <Link
        href="/account"
        className="hover:bg-secondary flex items-center gap-3 rounded-full p-1.5 pr-4 transition-colors"
      >
        <span
          aria-hidden
          className="bg-secondary text-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
        >
          {initial}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] font-semibold">{email}</span>
          <span className="text-muted-foreground text-xs">
            {t("shell.planLabel", { plan: planLabel })}
          </span>
        </span>
      </Link>
    </>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="bg-card sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto px-4 py-5 lg:flex">
        {sidebarBody}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            <m.button
              type="button"
              aria-label={t("shell.closeMenu")}
              onClick={() => setDrawerOpen(false)}
              className="bg-scrim absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <m.div
              className="bg-card relative flex h-full w-72 flex-col gap-6 overflow-y-auto px-4 py-5"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <button
                type="button"
                aria-label={t("shell.closeMenu")}
                onClick={() => setDrawerOpen(false)}
                className="bg-secondary text-foreground hover:bg-accent absolute top-4 right-4 flex size-10 items-center justify-center rounded-full transition-colors"
              >
                <ShellIcon name="close" className="size-5" />
              </button>
              {sidebarBody}
              <div className="flex items-center gap-2 sm:hidden" data-testid="drawer-preferences">
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </m.div>
          </div>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-col">
        {/* Top bar */}
        <header className="bg-background sticky top-0 z-40">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-8">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={t("shell.openMenu")}
                onClick={() => setDrawerOpen(true)}
                className="bg-secondary text-foreground hover:bg-accent flex size-10 items-center justify-center rounded-full transition-colors lg:hidden"
              >
                <ShellIcon name="menu" className="size-5" />
              </button>
              <Link href="/dashboard" aria-label={t("shell.home")} className="lg:hidden">
                <BrandLockup />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <CreditsChip
                userId={userId}
                initial={credits}
                monthlyCredits={monthlyCredits}
                className="lg:hidden"
              />
              {/* On a phone the bar can't fit these too (the bell was pushed off
                  screen and the page scrolled sideways); they live in the menu. */}
              <div className="hidden items-center gap-2 sm:flex">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              {bell}
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 pt-4 pb-16 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
