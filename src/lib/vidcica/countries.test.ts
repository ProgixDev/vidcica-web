import { describe, expect, it } from "vitest";
import {
  MAX_COUNTRIES,
  WORLDWIDE,
  countryLabel,
  countryOptions,
  matchesCountry,
  toggleCountry,
} from "./countries";

describe("countryOptions", () => {
  const fr = countryOptions("fr");
  const codes = new Set(fr.map((o) => o.code));

  // Regression: the Boost wizard offered five francophone markets only.
  it("offers every country Meta can target, well beyond the old five", () => {
    expect(fr.length).toBeGreaterThan(200);
    for (const code of ["FR", "BE", "CH", "LU", "CA", "US", "GB", "DE", "MA", "SN"]) {
      expect(codes.has(code)).toBe(true);
    }
  });

  it("leaves out non-countries, aliases, empty places and Meta-blocked countries", () => {
    for (const code of ["EU", "UN", "ZZ", "XK", "BU", "DD", "AQ", "BV", "CU", "IR", "RU"]) {
      expect(codes.has(code)).toBe(false);
    }
  });

  // Meta refused a live ad set reaching either one (subcodes 3858498, 3858550):
  // both need an advertiser declaration a boost can't make. Thailand and Brazil
  // passed the same test, so they stay.
  it("leaves out the countries that need a Meta advertiser declaration", () => {
    expect(codes.has("TW")).toBe(false);
    expect(codes.has("SG")).toBe(false);
    expect(codes.has("TH")).toBe(true);
    expect(codes.has("BR")).toBe(true);
  });

  it("names countries in the interface language and sorts by that name", () => {
    expect(fr.find((o) => o.code === "BE")?.name).toBe("Belgique");
    expect(countryOptions("en").find((o) => o.code === "BE")?.name).toBe("Belgium");
    const names = fr.map((o) => o.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "fr")));
  });
});

describe("matchesCountry", () => {
  const usa = { code: "US", name: "États-Unis" };

  it("ignores case and accents, and accepts the exact code", () => {
    expect(matchesCountry(usa, "etats")).toBe(true);
    expect(matchesCountry(usa, "ÉTATS")).toBe(true);
    expect(matchesCountry(usa, "us")).toBe(true);
    expect(matchesCountry(usa, "belg")).toBe(false);
  });

  it("matches everything when the search is empty", () => {
    expect(matchesCountry(usa, "  ")).toBe(true);
  });
});

describe("toggleCountry", () => {
  it("adds and removes a country", () => {
    expect(toggleCountry(["FR"], "BE", true)).toEqual(["FR", "BE"]);
    expect(toggleCountry(["FR", "BE"], "FR", false)).toEqual(["BE"]);
  });

  it("keeps worldwide exclusive in both directions", () => {
    expect(toggleCountry(["FR", "BE"], WORLDWIDE, true)).toEqual([WORLDWIDE]);
    expect(toggleCountry([WORLDWIDE], "FR", true)).toEqual(["FR"]);
  });

  it("stops at the per-campaign cap", () => {
    const full = Array.from({ length: MAX_COUNTRIES }, (_, i) => `C${i}`);
    expect(toggleCountry(full, "FR", true)).toEqual(full);
  });
});

describe("countryLabel", () => {
  it("reads worldwide and country codes as names", () => {
    expect(countryLabel(WORLDWIDE, "fr", "Monde entier")).toBe("Monde entier");
    expect(countryLabel("DE", "fr", "Monde entier")).toBe("Allemagne");
  });
});
