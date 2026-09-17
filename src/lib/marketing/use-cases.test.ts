import { describe, expect, it } from "vitest";
import { fr, en } from "@/lib/i18n/messages";
import { USE_CASES, findUseCase, listUseCasePaths } from "./use-cases";

describe("use cases", () => {
  it("has unique, URL-safe slugs", () => {
    const slugs = USE_CASES.map((u) => u.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
  });

  it("resolves a known slug and rejects an unknown one", () => {
    expect(findUseCase("restaurant")?.h1).toBe("useCase.restaurant.h1");
    expect(findUseCase("nope")).toBeUndefined();
  });

  it("has every copy key present in both dictionaries", () => {
    // A missing key renders the raw key on a public page, and English falls back
    // to French silently — so assert both dictionaries carry all of them.
    for (const u of USE_CASES) {
      for (const key of [u.metaTitle, u.metaDescription, u.h1, u.intro, ...u.ideas]) {
        expect(fr[key], `fr missing ${key}`).toBeTruthy();
        expect(en[key], `en missing ${key}`).toBeTruthy();
      }
    }
  });

  it("builds one path per trade", () => {
    expect(listUseCasePaths()).toEqual([
      "/cas-usage/restaurant",
      "/cas-usage/immobilier",
      "/cas-usage/coach-sportif",
      "/cas-usage/e-commerce",
    ]);
  });
});
