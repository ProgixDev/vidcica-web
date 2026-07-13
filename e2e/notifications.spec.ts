import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ-06 — Read a notification. Session-free guard runs here; the live-arrival
// + mark-read flow is gated on a seeded test user (a trigger must fire).

test("@cuj CUJ-06: /notifications is protected (auth guard)", async ({ page }) => {
  await page.goto("/notifications");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fnotifications/);
});

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

test("@cuj CUJ-06: notification centre renders (email user)", async ({ page }) => {
  test.skip(!email || !password, "Set E2E_TEST_EMAIL / E2E_TEST_PASSWORD to run.");
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByTestId("notification-bell")).toBeVisible();

  await page.goto("/notifications");
  await expect(page.getByTestId("notification-center")).toBeVisible();
  await shot(page, "notifications");
});
