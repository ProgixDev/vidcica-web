import { expect, test } from "@playwright/test";
import { shot } from "./utils/shot";

// CUJ-01 — Land and orient (docs/product/critical-user-journeys.md)
test("@cuj CUJ-01: visitor lands, understands Vidcica, reaches start", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /publiée partout, automatiquement/i }),
  ).toBeVisible();
  await shot(page, "home-landing");

  await page.getByRole("link", { name: "Commencer" }).click();
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByText("Vidcica", { exact: true })).toBeVisible();
});
