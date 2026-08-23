import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

/**
 * Social sign-in (Google + Apple) — the web half of the mobile app's
 * «Continuer avec …» block. Apple was added on web after mobile; these pin the
 * redirect contract so the two front-ends can't drift.
 */

test("@cuj sign-in offers both Google and Apple", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByTestId("auth-google")).toBeVisible();
  const apple = page.getByTestId("auth-apple");
  await expect(apple).toBeVisible();
  await expect(apple).toHaveText(/Continuer avec Apple/);
  await shot(page, "sign-in-social-providers");
});

test("the Apple button starts Apple's OAuth redirect and returns via /auth/callback", async ({
  page,
}) => {
  const authorize: string[] = [];
  // Stop at Supabase's /authorize so the test never leaves for Apple.
  await page.route("**/auth/v1/authorize**", async (route) => {
    authorize.push(route.request().url());
    await route.abort();
  });

  await page.goto("/sign-in");
  await page.getByTestId("auth-apple").click();

  await expect.poll(() => authorize.length).toBeGreaterThan(0);
  const [authorizeUrl = ""] = authorize;
  const url = new URL(authorizeUrl);
  expect(url.searchParams.get("provider")).toBe("apple");
  const redirectTo = new URL(url.searchParams.get("redirect_to") ?? "");
  expect(redirectTo.pathname).toBe("/auth/callback");
  expect(redirectTo.searchParams.get("provider")).toBe("apple");
  expect(redirectTo.searchParams.get("next")).toBe("/dashboard");
});

test("a failed Apple exchange returns to sign-in naming Apple", async ({ page }) => {
  // No `code` — the same branch a consumed/expired code or a disabled provider hits.
  await page.goto("/auth/callback?provider=apple");
  await expect(page).toHaveURL(/\/sign-in\?error=oauth&provider=apple/);
  await expect(page.locator('p[role="alert"]')).toContainText("Apple");
});
