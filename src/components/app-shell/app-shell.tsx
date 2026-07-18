"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
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
type NavItem = { href: string; label: string; icon: IconName };

const NAV_MAIN: NavItem[] = [
  { href: "/dashboard", label: "Accueil", icon: "home" },
  { href: "/videos", label: "Vidéos", icon: "film" },
  { href: "/networks", label: "Réseaux", icon: "share" },
  { href: "/ads", label: "Publicités", icon: "megaphone" },
  { href: "/leads", label: "Prospects", icon: "users" },
];

const NAV_SECONDARY: NavItem[] = [
  { href: "/billing", label: "Facturation", icon: "card" },
  { href: "/support", label: "Aide", icon: "lifebuoy" },
  { href: "/account", label: "Profil", icon: "user" },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      data-testid={`shell-nav-${item.href.slice(1)}`}
      className={cn(
        "flex items-center gap-3 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <ShellIcon name={item.icon} className="size-4.5 shrink-0" />
      {item.label}
    </Link>
  );
}

function NavSections({ pathname }: { pathname: string }) {
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return (
    <nav className="flex flex-1 flex-col gap-6" aria-label="Navigation principale">
      <div className="flex flex-col gap-1">
        {NAV_MAIN.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground px-3.5 pb-1 text-[10px] font-semibold tracking-widest uppercase">
          Compte
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
      <Link href="/dashboard" aria-label="Vidcica — accueil" className="px-1.5">
        <BrandLockup />
      </Link>
      <Link
        href="/create"
        data-testid="shell-create-cta"
        className={cn(buttonVariants(), "rounded-full font-semibold")}
      >
        <ShellIcon name="sparkle" className="size-4" />
        Créer une vidéo
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
        className="hover:bg-accent/60 flex items-center gap-3 rounded-md px-2 py-2 transition-colors"
      >
        <span
          aria-hidden
          className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
        >
          {initial}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{email}</span>
          <span className="text-muted-foreground text-xs">Offre {planLabel}</span>
        </span>
      </Link>
    </>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="border-border sticky top-0 hidden h-dvh flex-col gap-5 border-r px-4 py-5 lg:flex">
        {sidebarBody}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="bg-background relative flex h-full w-72 flex-col gap-5 px-4 py-5 shadow-2xl">
            <div className="flex items-center justify-between px-1.5">
              <BrandLockup />
              <button
                type="button"
                aria-label="Fermer le menu"
                onClick={() => setDrawerOpen(false)}
                className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-full"
              >
                <ShellIcon name="close" className="size-5" />
              </button>
            </div>
            {sidebarBody}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        {/* Top bar */}
        <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Ouvrir le menu"
                onClick={() => setDrawerOpen(true)}
                className="text-muted-foreground hover:text-foreground hover:bg-accent flex size-9 items-center justify-center rounded-full transition-colors lg:hidden"
              >
                <ShellIcon name="menu" className="size-5" />
              </button>
              <Link href="/dashboard" aria-label="Vidcica — accueil" className="lg:hidden">
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
              <ThemeToggle />
              {bell}
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
