import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ-04 — Connect a network & publish. Session-free parts run here; the full
// authenticated flow (real OAuth + publish) is gated on a seeded test user.

test("@cuj CUJ-04: /networks is protected (AC — auth guard)", async ({ page }) => {
  await page.goto("/networks");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fnetworks/);
});

test("@cuj CUJ-04: /videos/:id/publish is protected", async ({ page }) => {
  await page.goto("/videos/00000000-0000-0000-0000-000000000000/publish");
  await expect(page).toHaveURL(/\/sign-in\?next=/);
});

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

test("@cuj CUJ-04: networks screen lists platforms (email user)", async ({ page }) => {
  test.skip(!email || !password, "Set E2E_TEST_EMAIL / E2E_TEST_PASSWORD to run.");
  await page.goto("/sign-in");
  await page.getByLabel("Adresse e-mail").fill(email!);
  await page.getByLabel("Mot de passe").fill(password!);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/networks");
  await expect(page.getByTestId("network-list")).toBeVisible();
  await expect(page.getByTestId("network-youtube")).toBeVisible();
  await shot(page, "networks");
});
