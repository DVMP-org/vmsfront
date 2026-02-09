import { APIRequestContext, expect, Page } from "@playwright/test";
import { vmsConfig } from "../configs/vms.config";

export class BasePage {
  protected page: Page;
  protected request: APIRequestContext;

  constructor(page: Page, request: APIRequestContext) {
    this.page = page;
    this.request = request;
  }

  async navigateToPage(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight),
    );
  }

  async waitForLoadState(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
  }

  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  getInput(selector: string) {
    return this.page.locator(selector);
  }

  async waitForElement(selector: string, timeout = 30000): Promise<void> {
    await this.page.waitForSelector(selector, { timeout });
  }

  async clickElement(selector: string): Promise<void> {
    await this.page.locator(selector).click();
  }

  async fillInput(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).fill(value);
  }

  async selectOption(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).selectOption(value);
  }

  async getText(selector: string): Promise<string> {
    return (await this.page.locator(selector).textContent()) || "";
  }

  async isVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  async waitForUrl(url: string): Promise<void> {
    await this.page.waitForURL(url);
  }

  /**
   * Process login for VMS application
   */
  async processLogin(configArgs?: {
    email: string;
    password: string;
    redirectURL?: string;
  }): Promise<void> {
    const page = this.page;

    // Wait for login form elements to be visible
    await expect(page.locator("#login_email_input")).toBeVisible();
    await expect(page.locator("#login_password_input")).toBeVisible();
    await expect(page.locator("#login_submit_button")).toBeVisible();

    // Fill in credentials
    await page
      .locator("#login_email_input")
      .fill(configArgs?.email || vmsConfig.adminEmail);
    await page
      .locator("#login_password_input")
      .fill(configArgs?.password || vmsConfig.adminPassword);

    // Submit login
    await page.locator("#login_submit_button").click();

    // Wait for navigation after login
    if (configArgs?.redirectURL) {
      await this.waitForUrl(configArgs.redirectURL);
    } else {
      // Wait for any navigation away from login page
      await page.waitForURL((url) => !url.pathname.includes("/login"));
    }
  }
}
