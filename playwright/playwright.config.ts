import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./specs",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
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

  timeout: 45_000,
  expect: {
    timeout: 7_500,
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.VMS_BASE_URL || "http://lvh.me:3106",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "retain-on-failure",
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
    navigationTimeout: 20_000,
    actionTimeout: 10_000,
    testIdAttribute: "data-testid",
  },
  outputDir: "./evidence/artifacts",

  /* Configure projects for major browsers */
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "desktop-webkit",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile-webkit",
      use: {
        ...devices["iPhone 13"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command: "pnpm dev --hostname 0.0.0.0 --port 3106",
    cwd: "..",
    url: "http://lvh.me:3106/auth/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_API_URL: process.env.API_BASE_URL || "https://vmscore.to",
      NEXT_PUBLIC_BASE_DOMAIN: process.env.VMS_BASE_DOMAIN || "lvh.me",
      NEXT_PUBLIC_ENFORCE_SUBSCRIPTIONS: "false",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
  globalSetup: "./globalSetup.ts",
});
