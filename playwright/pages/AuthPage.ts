import { APIRequestContext, expect, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { vmsConfig } from "../configs/vms.config";

export class AuthPage extends BasePage {
  protected vmsBaseURL: string = vmsConfig.webBaseURL;

  constructor(page: Page, request: APIRequestContext) {
    super(page, request);
  }

  /**
   * Navigate to login page
   */
  async navigateToLogin(): Promise<void> {
    await this.navigateToPage(`${this.vmsBaseURL}/auth/login`);
    await this.waitForLoadState();
  }

  /**
   * Navigate to register page
   */
  async navigateToRegister(): Promise<void> {
    await this.navigateToPage(`${this.vmsBaseURL}/auth/register`);
    await this.waitForLoadState();
  }

  /**
   * Navigate to forgot password page
   */
  async navigateToForgotPassword(): Promise<void> {
    await this.navigateToPage(`${this.vmsBaseURL}/auth/forgot-password`);
    await this.waitForLoadState();
  }

  /**
   * Perform login action
   */
  async login(email?: string, password?: string): Promise<void> {
    await this.navigateToLogin();
    await this.processLogin({
      email: email || vmsConfig.adminEmail,
      password: password || vmsConfig.adminPassword,
    });
  }

  /**
   * Perform logout action
   */
  async logout(): Promise<void> {
    await this.page.locator("#profile_dropdown_button").click();

    // Assuming there's a logout button with specific ID or text
    const logoutButton = this.page.getByRole("button", { name: "Sign out" });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await this.page.waitForURL(`${this.vmsBaseURL}/auth/login`);
    }
  }

  /**
   * Verify user is logged in by checking for dashboard elements
   */
  async verifyLoggedIn(): Promise<void> {
    // Wait for navigation away from auth pages
    await this.page.waitForURL((url) => !url.pathname.includes("/auth/login"));
  }
}
