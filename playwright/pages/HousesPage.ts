import { APIRequestContext, expect, Page } from "@playwright/test";
import { AdminBasePage } from "./AdminBasePage";

export class HousesPage extends AdminBasePage {
  constructor(page: Page, request: APIRequestContext) {
    super(page, request);
  }

  /**
   * Open houses page
   */
  async openHousesPage(): Promise<void> {
    await this.navigateToHouses();
    await this.waitForTableLoad();
  }

  async clickCreateHouse(): Promise<void> {
    const createButton = this.page.locator("#add_house_button");
    await expect(createButton).toBeVisible();
    await createButton.click();
  }

  /**
   * Fill house form
   */
  async fillHouseForm(data: {
    houseNumber?: string;
    address?: string;
    ownerName?: string;
    status?: string;
  }): Promise<void> {
    if (data.houseNumber) {
      await this.page
        .locator("#house_number_input, [name='name']")
        .fill(data.houseNumber);
    }
    if (data.address) {
      await this.page
        .locator("#address_input, [name='address']")
        .fill(data.address);
    }
    // if (data.ownerName) {
    //   await this.page
    //     .locator("#owner_name_input, [name='ownerName']")
    //     .fill(data.ownerName);
    // }
    if (data.status) {
      await this.page.locator("#status_select, [name='status']").click();
      await this.page.getByRole("option", { name: data.status }).click();
    }
  }

  /**
   * Submit house form
   */
  async submitHouseForm(): Promise<void> {
    const submitButton = this.page.locator("#house_form_submit_button");
    await expect(submitButton).toBeVisible();
    await submitButton.click();
  }

  /**
   * Search for a house
   */
  async searchHouse(query: string): Promise<void> {
    await this.searchTable(query);
  }

  /**
   * View house details
   */
  async viewHouseDetails(houseNumber: string): Promise<void> {
    const viewButton = this.page
      .locator(`tr:has-text("${houseNumber}")`)
      .getByRole("button", { name: /view|details/i });
    await viewButton.click();
  }

  /**
   * Update house information
   */
  async updateHouse(houseNumber: string): Promise<void> {
    const editButton = this.page
      .locator(`tr:has-text("${houseNumber}")`)
      .getByRole("button", { name: /edit|update/i });
    await editButton.click();
  }

  /**
   * Delete a house
   */
  async deleteHouse(houseNumber: string): Promise<void> {
    const deleteButton = this.page
      .locator(`tr:has-text("${houseNumber}")`)
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
