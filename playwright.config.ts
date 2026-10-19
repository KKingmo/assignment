import { defineConfig, devices } from "@playwright/test";

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL ?? "http://127.0.0.1:3100";
const live = process.env.PLAYWRIGHT_LIVE === "1";

export default defineConfig({
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "live",
      testDir: "./tests/live",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: externalBaseURL
    ? undefined
    : {
        command:
          "npm run build && npm run start -- --hostname 127.0.0.1 --port 3100",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
        env: live ? undefined : {
          NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-e2e-test-key",
        },
      },
});
