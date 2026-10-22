import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests of the main workflows against a running Festa, the live
 * deployment by default. Set E2E_BASE_URL to test another one, such as
 * `npm run preview` on http://localhost:3000.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "https://festa-ten-blush.vercel.app",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /landing\.spec\.ts/ },
  ],
});
