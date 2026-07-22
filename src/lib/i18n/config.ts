/**
 * i18n core config — French-first bilingual (FR/EN), mirroring the mobile app's
 * `src/lib/i18n.ts` model (flat dot-keyed dicts, `t()` falls back to French).
 * The active locale is a cookie so Server Components render the right language
 * (no client flash); the LanguageToggle sets it and refreshes.
 */
export type Locale = "fr" | "en";

export const LOCALES: readonly Locale[] = ["fr", "en"] as const;
export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "vidcica.locale";

export function isLocale(v: string | undefined | null): v is Locale {
  return v === "fr" || v === "en";
}

export function resolveLocale(v: string | undefined | null): Locale {
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

export const LOCALE_LABEL: Record<Locale, string> = { fr: "Français", en: "English" };
