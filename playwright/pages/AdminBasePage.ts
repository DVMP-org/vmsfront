import { APIRequestContext, expect, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { vmsConfig } from "../configs/vms.config";

export class AdminBasePage extends BasePage {
  protected vmsBaseURL: string = vmsConfig.webBaseURL;

  constructor(page: Page, request: APIRequestContext) {
    super(page, request);
  }

  async waitForUrl(url: string): Promise<void> {
    await this.page.waitForURL(`${this.vmsBaseURL}${url}`);
    await this.page.waitForLoadState();
  }

  async navigateToPage(path: string): Promise<void> {
    await super.navigateToPage(`${this.vmsBaseURL}${path}`);
    await this.waitForUrl(path);
  }

  async waitForNetworkReq(): Promise<void> {
    await this.page.waitForLoadState("load");
  }

  /**
   * Process admin login
   */
  async processAdminLogin(config?: {
    email?: string;
    password?: string;
  }): Promise<void> {
    await this.navigateToPage("/auth/login");
    await this.page.waitForLoadState("domcontentloaded");

    await this.processLogin({
      email: config?.email || vmsConfig.adminEmail,
      password: config?.password || vmsConfig.adminPassword,
    });

    await this.navigateToPage(`/admin`);
    // Wait for redirect to admin dashboard
    await this.page.waitForURL(`${this.vmsBaseURL}/admin`);
  }

  /**
   * Wait for table to finish loading
   */
  async waitForTableLoad(): Promise<void> {
    const loadingElement = this.page.getByText("Loading...", { exact: true });
    await loadingElement
      .waitFor({ state: "hidden", timeout: 30000 })
      .catch(() => {
        // Loading element might not appear if data loads quickly
      });
  }

  /**
   * Reload table data
   */
  async reloadTable(): Promise<void> {
    const reloadButton = this.page.getByRole("button", {
      name: /Refetch|Reload|Refresh/i,
    });

    if (await reloadButton.isVisible()) {
      await reloadButton.click();
      await this.waitForTableLoad();
    }
  }

  /**
   * Search in table
   */
  async searchTable(query: string): Promise<void> {
    const searchBox = this.page.getByRole("textbox", {
      name: /search/i,
    });
    await searchBox.fill(query);
    await searchBox.press("Enter");
    await this.waitForTableLoad();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Confirm table row count
   */
  async confirmTableCount(expectedCount: number): Promise<void> {
    const rows = this.page.locator("table tbody tr");
    await expect(rows).toHaveCount(expectedCount);
  }

  /**
   * Navigate to admin houses page
   */
  async navigateToHouses(): Promise<void> {
    await this.navigateToPage("/admin/houses");
  }

  /**
   * Navigate to admin residents page
   */
  async navigateToResidents(): Promise<void> {
    await this.navigateToPage("/admin/residents");
  }

  /**
   * Navigate to admin gate events page
   */
  async navigateToGateEvents(): Promise<void> {
    await this.navigateToPage("/admin/gate/events");
  }

  /**
   * Navigate to admin dues page
   */
  async navigateToDues(): Promise<void> {
    await this.navigateToPage("/admin/dues");
  }

  /**
   * Navigate to admin analytics page
   */
  async navigateToAnalytics(): Promise<void> {
    await this.navigateToPage("/admin/analytics");
  }

  /**
   * Navigate to admin transactions page
   */
  async navigateToTransactions(): Promise<void> {
    await this.navigateToPage("/admin/transactions");
  }

  /**
   * Navigate to admin forums page
   */
  async navigateToForums(): Promise<void> {
    await this.navigateToPage("/admin/forums");
  }
}
