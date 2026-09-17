import { describe, expect, it } from "vitest";
import { isUnlocalizedPath, localizedPath, splitLocalePath } from "./routing";

describe("splitLocalePath", () => {
  it("reads the English prefix and hands back the path to render", () => {
    expect(splitLocalePath("/en/privacy")).toEqual({
      locale: "en",
      path: "/privacy",
      prefixed: true,
    });
    expect(splitLocalePath("/en")).toEqual({ locale: "en", path: "/", prefixed: true });
  });

  it("treats an unprefixed path as French, untouched", () => {
    // The registered URLs (/privacy, /terms, /supprimer-mon-compte) must keep
    // resolving exactly as they do today.
    expect(splitLocalePath("/privacy")).toEqual({
      locale: "fr",
      path: "/privacy",
      prefixed: false,
    });
    expect(splitLocalePath("/")).toEqual({ locale: "fr", path: "/", prefixed: false });
  });

  it("does not treat /fr as a prefix — French has no prefix", () => {
    // Otherwise /fr would render the home page and compete with / for the same
    // content, which is exactly the duplicate this scheme avoids.
    expect(splitLocalePath("/fr/privacy")).toEqual({
      locale: "fr",
      path: "/fr/privacy",
      prefixed: false,
    });
  });

  it("leaves a lookalike segment alone", () => {
    expect(splitLocalePath("/energy")).toEqual({ locale: "fr", path: "/energy", prefixed: false });
  });
});

describe("localizedPath", () => {
  it("prefixes English and leaves French bare", () => {
    expect(localizedPath("/privacy", "en")).toBe("/en/privacy");
    expect(localizedPath("/privacy", "fr")).toBe("/privacy");
    expect(localizedPath("/", "en")).toBe("/en");
    expect(localizedPath("/", "fr")).toBe("/");
  });

  it("round-trips with splitLocalePath", () => {
    for (const path of ["/", "/privacy", "/videos/abc"]) {
      expect(splitLocalePath(localizedPath(path, "en")).path).toBe(path);
      expect(splitLocalePath(localizedPath(path, "fr")).path).toBe(path);
    }
  });

  it("never prefixes a callback URL registered with a third party", () => {
    // Supabase, Google, Meta and TikTok all hold these exact URLs.
    expect(localizedPath("/auth/callback", "en")).toBe("/auth/callback");
    expect(localizedPath("/oauth/connected", "en")).toBe("/oauth/connected");
  });
});

describe("isUnlocalizedPath", () => {
  it("covers callbacks and machine endpoints, not ordinary pages", () => {
    expect(isUnlocalizedPath("/auth/callback")).toBe(true);
    expect(isUnlocalizedPath("/sitemap.xml")).toBe(true);
    expect(isUnlocalizedPath("/privacy")).toBe(false);
  });
});
