import "server-only";
import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  resolveLocale,
  makeT,
  type Locale,
  type TFunction,
} from "./index";
import { LOCALE_HEADER, PATH_HEADER, localeFromHeader } from "./routing";

/** The locale the URL itself declares — `en` under /en, `fr` everywhere else.
 *  Canonical and hreflang build on this, never on the cookie: a crawler sends no
 *  cookie, so the URL is the only stable signal. */
export async function getUrlLocale(): Promise<Locale> {
  const h = await headers();
  return localeFromHeader(h.get(LOCALE_HEADER));
}

/** Active locale for rendering.
 *
 *  An /en URL is decisive — that is what makes English separately indexable.
 *  Off the prefix, the cookie carries a signed-in user's choice through the app,
 *  whose internal links are deliberately prefix-free (those pages are noindex,
 *  so there is nothing to split). French is the default. */
export async function getLocale(): Promise<Locale> {
  const urlLocale = await getUrlLocale();
  if (urlLocale !== DEFAULT_LOCALE) return urlLocale;
  const store = await cookies();
  return resolveLocale(store.get(LOCALE_COOKIE)?.value);
}

/** The current path with any locale prefix removed (e.g. `/privacy` for both
 *  `/privacy` and `/en/privacy`) — the base for canonical + hreflang URLs. */
export async function getPathname(): Promise<string> {
  const h = await headers();
  return h.get(PATH_HEADER) ?? "/";
}

/** A locale-bound `t()` for Server Components. */
export async function getT(): Promise<TFunction> {
  return makeT(await getLocale());
}
