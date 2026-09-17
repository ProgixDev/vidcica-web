"use client";

import { createContext, useContext, useMemo, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { makeT, DEFAULT_LOCALE, LOCALE_COOKIE, type Locale, type TFunction } from "./index";
import { localizedPath, splitLocalePath } from "./routing";

type I18nValue = {
  locale: Locale;
  t: TFunction;
  /** True while a language switch is in flight (server re-render). */
  isSwitching: boolean;
  switchLocale: (next: Locale) => void;
};

const I18nContext = createContext<I18nValue | null>(null);

/** Persist the chosen locale (module scope — a property write inside a component
 *  body trips the react-compiler immutability rule). */
function writeLocaleCookie(next: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
}

/** Wraps the app with the request locale (provided by the Server root layout).
 *  Owns the switch action so both the toggle and the fade wrapper share one
 *  `isSwitching` state. */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSwitching, startTransition] = useTransition();
  const value = useMemo<I18nValue>(
    () => ({
      locale,
      t: makeT(locale),
      isSwitching,
      switchLocale: (next: Locale) => {
        if (next === locale) return;
        // Remembered for any request that bypasses middleware; the URL is what
        // actually decides the language (see lib/i18n/routing.ts).
        writeLocaleCookie(next);
        // Navigate to the same page in the other language — French at the root,
        // English under /en — so the choice is shareable and indexable.
        const target = localizedPath(splitLocalePath(pathname).path, next);
        // `isSwitching` stays true until the new page lands, driving the crossfade.
        startTransition(() => router.push(target));
      },
    }),
    [locale, isSwitching, router, pathname],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// Default to French (the source-of-truth locale) when rendered outside a
// provider — resilient for isolated unit tests and stray mounts, no crash.
const FALLBACK: I18nValue = {
  locale: DEFAULT_LOCALE,
  t: makeT(DEFAULT_LOCALE),
  isSwitching: false,
  switchLocale: () => {},
};

function useI18n(): I18nValue {
  return useContext(I18nContext) ?? FALLBACK;
}

/** Locale-bound `t()` for Client Components. */
export function useT(): TFunction {
  return useI18n().t;
}

export function useLocale(): Locale {
  return useI18n().locale;
}

/** The language-switch action + its pending state (toggle + fade wrapper). */
export function useLocaleSwitch(): { isSwitching: boolean; switchLocale: (next: Locale) => void } {
  const { isSwitching, switchLocale } = useI18n();
  return { isSwitching, switchLocale };
}

/**
 * Fades the page content out and back in while the language switch re-renders.
 * Opacity only — `transform`/`filter` would make `position: fixed` descendants
 * (the mobile drawer) resolve against this wrapper instead of the viewport.
 */
export function LocaleTransition({ children }: { children: React.ReactNode }) {
  const { isSwitching } = useLocaleSwitch();
  return (
    <div
      aria-busy={isSwitching || undefined}
      style={{
        transition: "opacity 220ms ease",
        opacity: isSwitching ? 0.35 : 1,
      }}
    >
      {children}
    </div>
  );
}
