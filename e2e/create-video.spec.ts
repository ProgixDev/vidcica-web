import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ-03 — Create and watch a video render (docs/product/critical-user-journeys.md).
// The parts that need no session run here. The full authenticated journey needs a
// seeded test user (set E2E_TEST_EMAIL / E2E_TEST_PASSWORD) — see the guarded test.

test("@cuj CUJ-03: protected routes redirect to sign-in with a next param (AC-3)", async ({
  page,
}) => {
  await page.goto("/create");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fcreate/);
  await expect(page.getByRole("heading", { name: /Vidcica|Welcome|Bienvenue/i })).toBeVisible();
});

test("@cuj CUJ-03: sign-in offers email + phone methods (AC-1/AC-2 surface)", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("tab", { name: "E-mail" })).toBeVisible();
  await shot(page, "signin-email");

  await page.getByRole("tab", { name: "Téléphone" }).click();
  await expect(page.getByLabel("Numéro de téléphone")).toBeVisible();
  await shot(page, "signin-phone");
});

// Full journey: sign in → dashboard → create → render → download.
// Runs only when a seeded test user is configured (no real SMS involved — email path).
const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

test("@cuj CUJ-03: full create journey (email user)", async ({ page }) => {
  test.skip(!email || !password, "Set E2E_TEST_EMAIL / E2E_TEST_PASSWORD to run the full journey.");

  await page.goto("/sign-in");
  await page.getByLabel("Adresse e-mail").fill(email!);
  await page.getByLabel("Mot de passe").fill(password!);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await shot(page, "dashboard");

  await page.getByRole("link", { name: "Créer une vidéo" }).first().click();
  await expect(page).toHaveURL(/\/create/);
  await page
    .getByTestId("composer-prompt")
    .fill("3 astuces pour gagner du temps le matin sans stress");
  await page.getByTestId("composer-submit").click();

  // Plan review appears, then enqueue routes to the render/detail view.
  await expect(page.getByTestId("plan-review")).toBeVisible({ timeout: 30_000 });
  await shot(page, "plan-review");
  await page.getByTestId("enqueue-btn").click();
  await expect(page).toHaveURL(/\/videos\//, { timeout: 30_000 });
  await shot(page, "render-or-detail");
});
