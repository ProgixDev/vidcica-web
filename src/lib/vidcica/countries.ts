/**
 * The countries a Boost can target, named in the interface language.
 *
 * Derived from the runtime's own region data (Intl.DisplayNames) rather than
 * typed out: every two-letter code it can name, minus deprecated aliases and
 * the entries in NOT_TARGETABLE. The wizard offered five francophone markets
 * until 2026-10-05; Meta and create-ad-campaign accept any country.
 *
 * WORLDWIDE ("ALL") is how both apps say "every country" (the mobile app's
 * "Tous les pays" chip sends the same value); create-ad-campaign turns it into
 * Meta's worldwide country group.
 */
export const WORLDWIDE = "ALL";

/** Matches the server action's cap on one campaign. */
export const MAX_COUNTRIES = 25;

/**
 * Meta refuses any ad there unless it carries a regional advertiser
 * declaration backed by identities verified in the advertiser's Business
 * settings, which a boost can't make for a creator. create-ad-campaign leaves
 * them out of Worldwide and refuses them as picks (`country_unavailable`).
 */
export const NEEDS_DECLARATION: readonly string[] = ["SG", "TW"];

const NOT_TARGETABLE = new Set([
  // Not countries: groupings, private-use and unknown regions in CLDR.
  "EU",
  "EZ",
  "UN",
  "QO",
  "XA",
  "XB",
  "ZZ",
  // Codes outside ISO 3166-1, which is all Meta's country targeting accepts.
  "AC",
  "CP",
  "CQ",
  "DG",
  "EA",
  "IC",
  "TA",
  "XK",
  // Nobody to reach.
  "AQ",
  "BV",
  "GS",
  "HM",
  "IO",
  "PN",
  "TF",
  "UM",
  // Meta does not deliver ads there (sanctions; Russia since March 2022).
  "CU",
  "IR",
  "KP",
  "RU",
  "SY",
  ...NEEDS_DECLARATION,
]);

/** Shown only where the runtime has no Intl.DisplayNames (very old browsers). */
const FALLBACK = ["FR", "BE", "CH", "LU", "CA", "US"];

export type CountryOption = { code: string; name: string };

/** Every targetable country, named in `locale` and sorted by that name. */
export function countryOptions(locale: string): CountryOption[] {
  let names: Intl.DisplayNames;
  try {
    names = new Intl.DisplayNames([locale], { type: "region", fallback: "none" });
  } catch {
    return FALLBACK.map((code) => ({ code, name: code }));
  }
  const out: CountryOption[] = [];
  for (let first = 65; first <= 90; first++) {
    for (let second = 65; second <= 90; second++) {
      const code = String.fromCharCode(first, second);
      if (NOT_TARGETABLE.has(code)) continue;
      const name = names.of(code);
      if (!name) continue;
      // A deprecated alias canonicalizes to its successor (BU → MM, DD → DE),
      // which is listed under its own code.
      if (Intl.getCanonicalLocales(`und-${code}`)[0] !== `und-${code}`) continue;
      out.push({ code, name });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, locale));
}

const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Case- and accent-insensitive match on the name, or an exact code ("us"). */
export function matchesCountry(option: CountryOption, query: string): boolean {
  const q = fold(query.trim());
  if (!q) return true;
  return fold(option.name).includes(q) || option.code.toLowerCase() === q;
}

/**
 * The selection after (un)ticking `code`. Worldwide excludes every single
 * country (Meta can't combine them), and a campaign holds MAX_COUNTRIES at most.
 */
export function toggleCountry(selected: readonly string[], code: string, on: boolean): string[] {
  if (!on) return selected.filter((c) => c !== code);
  if (code === WORLDWIDE) return [WORLDWIDE];
  const rest = selected.filter((c) => c !== WORLDWIDE && c !== code);
  return rest.length >= MAX_COUNTRIES ? rest : [...rest, code];
}

/** A selected code as the user reads it. */
export function countryLabel(code: string, locale: string, worldwideLabel: string): string {
  if (code === WORLDWIDE) return worldwideLabel;
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
