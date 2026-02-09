import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./test-suites",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [
        ["dot"],
        ["list"],
        ["github"],
        ["html", { outputFolder: "playwright-report", open: "never" }],
      ]
    : [["html", { open: "on-failure" }], ["list"]],

  timeout: 900000,
  expect: {
    timeout: 60000,
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.VMS_BASE_URL || "http://localhost:3000",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    launchOptions: {
      args: [
        "--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure",
      ],
    },
    video: {
      mode: "retain-on-failure",
      size: { width: 1920, height: 1080 },
    },
    screenshot: "only-on-failure",
    navigationTimeout: 120000,
    actionTimeout: 60000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    // {
    //   name: "firefox",
    //   use: {
    //     ...devices["Desktop Firefox"],
    //   },
    // },
    // {
    //   name: "webkit",
    //   use: {
    //     ...devices["Desktop Safari"],
    //   },
    // },
  ],
  globalSetup: "./globalSetup.ts",
});
