"use client";

import { createContext, useContext, useMemo } from "react";
import { makeT, DEFAULT_LOCALE, type Locale, type TFunction } from "./index";

type I18nValue = { locale: Locale; t: TFunction };

const I18nContext = createContext<I18nValue | null>(null);

/** Wraps the app with the request locale (provided by the Server root layout).
 *  Client Components read `t()` via `useT()`. */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo<I18nValue>(() => ({ locale, t: makeT(locale) }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// Default to French (the source-of-truth locale) when rendered outside a
// provider — resilient for isolated unit tests and stray mounts, no crash.
const FALLBACK: I18nValue = { locale: DEFAULT_LOCALE, t: makeT(DEFAULT_LOCALE) };

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
