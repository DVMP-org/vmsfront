import { APIRequestContext, expect, Page } from "@playwright/test";
import { AdminBasePage } from "./AdminBasePage";

export class ResidentsPage extends AdminBasePage {
  constructor(page: Page, request: APIRequestContext) {
    super(page, request);
  }

  /**
   * Open residents page
   */
  async openResidentsPage(): Promise<void> {
    await this.navigateToResidents();
    await this.waitForTableLoad();
  }

  /**
   * Click create resident button
   */
  async clickCreateResident(): Promise<void> {
    const createButton = this.page.getByRole("button", {
      name: /create|add.*resident/i,
    });
    await expect(createButton).toBeVisible();
    await createButton.click();
  }

  /**
   * Fill resident form
   */
  async fillResidentForm(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    houseNumber?: string;
  }): Promise<void> {
    if (data.firstName) {
      await this.page
        .locator("#firstname_input, [name='first_name']")
        .fill(data.firstName);
    }
    if (data.lastName) {
      await this.page
        .locator("#lastname_input, [name='last_name']")
        .fill(data.lastName);
    }
    if (data.phone) {
      await this.page.locator("#phone_input, [name='phone']").fill(data.phone);
    }
    if (data.houseNumber) {
      await this.page
        .locator("#house_input, [name='address']")
        .fill(data.houseNumber);
    }
  }

  /**
   * Submit resident form
   */
  async submitResidentForm(): Promise<void> {
    const submitButton = this.page.locator("#new_resident_form_submit_button");
    await expect(submitButton).toBeVisible();
    await submitButton.click();
  }

  /**
   * Search for a resident
   */
  async searchResident(query: string): Promise<void> {
    await this.searchTable(query);
  }

  /**
   * View resident details
   */
  async viewResidentDetails(residentName: string): Promise<void> {
    const viewButton = this.page
      .locator(`tr:has-text("${residentName}")`)
      .getByRole("button", { name: /view|details/i });
    await viewButton.click();
  }

  /**
   * Delete a resident
   */
  async deleteResident(residentName: string): Promise<void> {
    const deleteButton = this.page
      .locator(`tr:has-text("${residentName}")`)
      .getByRole("button", { name: /delete/i });
    await deleteButton.click();

    // Confirm deletion
    const confirmButton = this.page.getByRole("button", {
      name: /confirm|yes|delete/i,
    });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
  }
}
