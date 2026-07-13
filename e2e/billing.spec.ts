import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ-05 — Subscribe to a plan. Session-free guard runs here; the full checkout
// (real Stripe test mode) is gated on a seeded test user.

test("@cuj CUJ-05: /billing is protected (auth guard)", async ({ page }) => {
  await page.goto("/billing");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fbilling/);
});

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

test("@cuj CUJ-05: billing shows the plan + tiers (email user)", async ({ page }) => {
  test.skip(!email || !password, "Set E2E_TEST_EMAIL / E2E_TEST_PASSWORD to run.");
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/billing");
  await expect(page.getByTestId("paywall")).toBeVisible();
  await expect(page.getByTestId("current-plan")).toBeVisible();
  await expect(page.getByTestId("plan-pro")).toBeVisible();
  await shot(page, "billing");
});
