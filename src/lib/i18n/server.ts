import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, resolveLocale, makeT, type Locale, type TFunction } from "./index";

/** Active locale for the current request (from the cookie; defaults to French).
 *  Reading the cookie opts the route into dynamic rendering — acceptable here
 *  (the app pages are already dynamic; the locale must be request-scoped). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return resolveLocale(store.get(LOCALE_COOKIE)?.value);
}

/** A locale-bound `t()` for Server Components. */
export async function getT(): Promise<TFunction> {
  return makeT(await getLocale());
}
