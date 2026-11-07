const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("../../../node_modules/@playwright/test");

const base = process.env.VMS_CONTEXT_BASE || "http://context-acceptance.localhost:3003";
const email = process.env.VMS_TEST_EMAIL;
const password = process.env.VMS_TEST_PASSWORD;
const output = __dirname;
const issues = [];

async function waitForPage(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(700);
}

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(output, name), fullPage: true });
}

(async () => {
  assert.ok(email, "VMS_TEST_EMAIL is required");
  assert.ok(password, "VMS_TEST_PASSWORD is required");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") issues.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => issues.push(`page: ${error.message}`));

  await page.goto(`${base}/auth/login`);
  await page.locator("#login_email_input").fill(email);
  await page.locator("#login_password_input").fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL(/\/select|\/admin/);

  await page.goto(`${base}/admin/properties`);
  await page.getByRole("heading", { name: /^Properties/ }).waitFor();
  await page.getByLabel("Top-level within this organization").uncheck();
  await page.getByText("Harbour Hotel").waitFor();
  await screenshot(page, "properties-desktop.png");

  await page.getByRole("button", { name: /Harbour Hotel Active/ }).click();
  await page.getByRole("heading", { name: "Harbour Hotel" }).waitFor();
  await screenshot(page, "property-detail-desktop.png");

  await page.getByRole("button", { name: "Open workspace" }).click();
  await page.waitForURL(/\/admin$/);
  await page.getByRole("button", { name: /Harbour Hotel/ }).first().waitFor();
  await screenshot(page, "property-context-desktop.png");

  await page.goto(`${base}/admin/charges`);
  await page.getByText("Harbour service charge").waitFor();
  await screenshot(page, "charges-directory-desktop.png");
  await page.getByRole("link", { name: /Harbour service charge/ }).click();
  await page.getByRole("heading", { name: "Harbour service charge" }).waitFor();
  await page.getByText("Harbour Offices").waitFor();
  await screenshot(page, "charge-detail-desktop.png");

  await page.goto(`${base}/admin/organization`);
  await page.getByRole("heading", { name: "Context Acceptance" }).waitFor();
  await page.getByText("Mixed use").waitFor();
  await screenshot(page, "organization-settings-desktop.png");

  await page.getByRole("button", { name: /Harbour Hotel/ }).first().click();
  await page.getByRole("button", { name: /Harbour Offices/ }).click();
  await page.getByRole("button", { name: /Harbour Offices/ }).first().waitFor();
  await page.waitForTimeout(700);
  assert.equal(await page.getByRole("link", { name: "Guest stays" }).count(), 0);
  await screenshot(page, "commercial-context-gating-desktop.png");

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await mobile.addCookies(await context.cookies());
  const mobilePage = await mobile.newPage();
  mobilePage.on("console", (message) => {
    if (message.type() === "error")
      issues.push(`mobile console: ${message.text()}`);
  });
  mobilePage.on("pageerror", (error) =>
    issues.push(`mobile page: ${error.message}`),
  );
  await mobilePage.goto(`${base}/admin/properties`);
  await mobilePage.getByRole("heading", { name: /^Properties/ }).waitFor();
  await mobilePage
    .getByLabel("Top-level within this organization")
    .uncheck();
  await mobilePage.getByText("Harbour Hotel").waitFor();
  await screenshot(mobilePage, "properties-mobile-393.png");
  await mobilePage.goto(`${base}/admin/charges`);
  await mobilePage.getByText("Harbour service charge").waitFor();
  await screenshot(mobilePage, "charges-mobile-393.png");

  fs.writeFileSync(
    path.join(output, "browser-result.json"),
    JSON.stringify({ url: page.url(), issues }, null, 2),
  );
  assert.deepEqual(issues, []);
  await browser.close();
  console.log(JSON.stringify({ ok: true, screenshots: 9, issues }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
