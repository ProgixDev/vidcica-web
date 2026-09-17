import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/i18n/config";
import { ARTICLES, articlesFor, blogPaths, findArticle } from "./blog";

describe("blog content", () => {
  it("has unique, URL-safe slugs", () => {
    const slugs = ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
  });

  it("exists in at least one language, with a complete body", () => {
    for (const a of ARTICLES) {
      const written = LOCALES.filter((l) => a.content[l]);
      expect(written.length, `${a.slug} has no content`).toBeGreaterThan(0);
      for (const locale of written) {
        const body = a.content[locale]!;
        expect(body.title, `${a.slug}/${locale} title`).toBeTruthy();
        expect(body.intro, `${a.slug}/${locale} intro`).toBeTruthy();
        expect(body.outro, `${a.slug}/${locale} outro`).toBeTruthy();
        expect(body.sections.length, `${a.slug}/${locale} sections`).toBeGreaterThan(1);
        // Meta descriptions get truncated in results past ~160 characters.
        expect(
          body.description.length,
          `${a.slug}/${locale} description too long`,
        ).toBeLessThanOrEqual(200);
      }
    }
  });

  it("has a valid ISO publish date", () => {
    for (const a of ARTICLES) {
      expect(a.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(a.published))).toBe(false);
    }
  });

  it("lists newest first, per locale", () => {
    for (const locale of LOCALES) {
      const dates = articlesFor(locale).map((a) => a.published);
      expect([...dates].sort((x, y) => y.localeCompare(x))).toEqual(dates);
    }
  });

  it("only reports paths for locales an article was actually written in", () => {
    // The routes 404 on a missing translation, so the sitemap must not claim it.
    for (const locale of LOCALES) {
      for (const path of blogPaths(locale)) {
        const slug = path.replace("/blog/", "");
        expect(findArticle(slug)?.content[locale], `${slug} missing ${locale}`).toBeTruthy();
      }
    }
  });

  it("resolves a known slug and rejects an unknown one", () => {
    expect(findArticle(ARTICLES[0]!.slug)).toBeDefined();
    expect(findArticle("not-an-article")).toBeUndefined();
  });
});
