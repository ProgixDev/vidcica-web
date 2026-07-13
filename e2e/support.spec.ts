import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ-07 — Get support. Session-free guard runs here; the live Lia reply + real
// ticket insert are gated on a seeded test user.

test("@cuj CUJ-07: /support is protected (auth guard)", async ({ page }) => {
  await page.goto("/support");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fsupport/);
});

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

test("@cuj CUJ-07: support tabs render (email user)", async ({ page }) => {
  test.skip(!email || !password, "Set E2E_TEST_EMAIL / E2E_TEST_PASSWORD to run.");
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/support");
  await expect(page.getByTestId("support-tabs")).toBeVisible();
  await expect(page.getByTestId("support-chat")).toBeVisible();
  await shot(page, "support-chat");
  await page.getByTestId("tab-contact").click();
  await expect(page.getByTestId("contact-form")).toBeVisible();
  await shot(page, "support-contact");
});
