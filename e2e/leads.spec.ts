import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ-09 — Work a lead. Session-free guard runs headless; managing a real lead is
// gated on a seeded test user with captured leads.

test("@cuj CUJ-09: /leads is protected (auth guard)", async ({ page }) => {
  await page.goto("/leads");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fleads/);
});

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

test("@cuj CUJ-09: leads surface renders (email user)", async ({ page }) => {
  test.skip(!email || !password, "Set E2E_TEST_EMAIL / E2E_TEST_PASSWORD to run.");
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/leads");
  await expect(page.getByTestId("leads-empty").or(page.getByTestId("leads-list"))).toBeVisible();
  await shot(page, "leads-list");
});
