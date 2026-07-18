import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ-08 — Boost a video into an ad. The session-free guard runs headless; the
// real create/activate path is gated on a seeded test user AND a configured Meta
// app (real spend), so it stays skipped in CI.

test("@cuj CUJ-08: /ads is protected (auth guard)", async ({ page }) => {
  await page.goto("/ads");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fads/);
});

test("@cuj CUJ-08: /ads/new is protected (auth guard)", async ({ page }) => {
  await page.goto("/ads/new");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fads%2Fnew/);
});

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

test("@cuj CUJ-08: ads surface renders (email user)", async ({ page }) => {
  test.skip(!email || !password, "Set E2E_TEST_EMAIL / E2E_TEST_PASSWORD to run.");
  await page.goto("/sign-in");
  await page.getByLabel("Adresse e-mail").fill(email!);
  await page.getByLabel("Mot de passe").fill(password!);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/ads");
  await shot(page, "ads-list");
  await page.goto("/ads/new");
  await shot(page, "ads-boost");
});
