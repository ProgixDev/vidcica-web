import { defineConfig, devices } from "@playwright/test";

/**
 * E2E + screenshot evidence config.
 * - Locally: reuses your `pnpm dev` server (or starts one).
 * - CI: expects a production build (`pnpm build`) and starts `pnpm start`.
 * Screenshots are written by e2e/utils/shot.ts into artifacts/screenshots/.
 */
// E2E_PORT lets a dev machine sidestep an unrelated server already bound to
// 3000 (Playwright would otherwise "reuse" the wrong app).
const port = process.env.E2E_PORT ?? "3000";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: process.env.CI ? `pnpm start -p ${port}` : `pnpm dev -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
