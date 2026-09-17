import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

const urls = () => sitemap().map((e) => e.url.replace(/^https?:\/\/[^/]+/, ""));

describe("sitemap", () => {
  it("lists a translated page once per language", () => {
    expect(urls()).toContain("/");
    expect(urls()).toContain("/en");
    expect(urls()).toContain("/mentions-legales");
    expect(urls()).toContain("/en/mentions-legales");
  });

  it("lists the bilingual legal documents once, un-prefixed", () => {
    // /privacy and /terms print FR and EN on one page; an /en twin would be the
    // same bytes at a second URL. Those exact paths are also registered with
    // Google, Meta, TikTok and the Play Store.
    expect(urls()).toContain("/privacy");
    expect(urls()).toContain("/terms");
    expect(urls()).not.toContain("/en/privacy");
    expect(urls()).not.toContain("/en/terms");
  });

  it("pairs each translated entry with its alternates, and pairs nothing else", () => {
    const bySlug = new Map(sitemap().map((e) => [e.url.replace(/^https?:\/\/[^/]+/, ""), e]));
    const home = bySlug.get("/")!;
    expect(Object.keys(home.alternates?.languages ?? {})).toEqual(["fr", "en"]);
    expect(bySlug.get("/privacy")!.alternates).toBeUndefined();
  });

  it("keeps private routes out", () => {
    const priv = urls().filter((u) => /dashboard|account|videos|billing|api/.test(u));
    expect(priv).toEqual([]);
  });
});
