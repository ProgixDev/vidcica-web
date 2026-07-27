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
  await page.getByLabel("Adresse e-mail").fill(email!);
  await page.getByLabel("Mot de passe").fill(password!);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/support");
  await expect(page.getByTestId("support-tabs")).toBeVisible();
  await expect(page.getByTestId("support-chat")).toBeVisible();
  await shot(page, "support-chat");
  await page.getByTestId("tab-contact").click();
  await expect(page.getByTestId("contact-form")).toBeVisible();
  await shot(page, "support-contact");
});

test("@cuj CUJ-07: Lia bubble opens the chat from any page (email user)", async ({ page }) => {
  test.skip(!email || !password, "Set E2E_TEST_EMAIL / E2E_TEST_PASSWORD to run.");
  await page.goto("/sign-in");
  await page.getByLabel("Adresse e-mail").fill(email!);
  await page.getByLabel("Mot de passe").fill(password!);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // The floating bubble is present on a normal app page (not /support).
  const fab = page.getByTestId("lili-fab");
  await expect(fab).toBeVisible();
  await shot(page, "lili-bubble-closed");

  // Opening reveals the Messenger-style panel with Lia's greeting.
  await fab.click();
  await expect(page.getByTestId("lili-panel")).toBeVisible();
  await expect(page.getByTestId("lili-msg-lia").first()).toBeVisible();
  await shot(page, "lili-bubble-open");

  // And it closes again.
  await page.getByTestId("lili-close").click();
  await expect(page.getByTestId("lili-panel")).toHaveCount(0);

  // Not duplicated on the full Help center (the chat lives there already).
  await page.goto("/support");
  await expect(page.getByTestId("lili-fab")).toHaveCount(0);
});
