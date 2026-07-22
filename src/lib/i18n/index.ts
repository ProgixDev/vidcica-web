/**
 * Public i18n API. `translate(locale, key, vars)` is the primitive; server and
 * client bindings live in `./server` and `./provider`.
 */
import { fr, en, type MessageKey } from "./messages";
import type { Locale } from "./config";

export type { Locale, MessageKey };
export {
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_LABEL,
  isLocale,
  resolveLocale,
} from "./config";

export type TVars = Record<string, string | number>;

/** Interpolate `{name}` placeholders. */
function interpolate(template: string, vars?: TVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Look up a key for a locale; English falls back to French for any missing key. */
export function translate(locale: Locale, key: MessageKey, vars?: TVars): string {
  const value = (locale === "en" ? (en[key] ?? fr[key]) : fr[key]) as string;
  return interpolate(value, vars);
}

/** A locale-bound `t()` — the shape both server and client expose. */
export type TFunction = (key: MessageKey, vars?: TVars) => string;

export function makeT(locale: Locale): TFunction {
  return (key, vars) => translate(locale, key, vars);
}
