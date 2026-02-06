import { APIRequestContext, expect, Page } from "@playwright/test";
import { AdminBasePage } from "./AdminBasePage";

export class GateEventsPage extends AdminBasePage {
  constructor(page: Page, request: APIRequestContext) {
    super(page, request);
  }

  /**
   * Open gate events page
   */
  async openGateEventsPage(): Promise<void> {
    await this.navigateToGateEvents();
    await this.waitForTableLoad();
  }

  /**
   * Search for a gate event
   */
  async searchGateEvent(query: string): Promise<void> {
    await this.searchTable(query);
  }

  /**
   * View event details
   */
  async viewEventDetails(eventId: string): Promise<void> {
    const viewButton = this.page
      .locator(`tr:has-text("${eventId}")`)
      .getByRole("button", { name: /view|details/i });
    await viewButton.click();
  }

  /**
   * Filter events by status
   */
  async filterByStatus(status: string): Promise<void> {
    const statusFilter = this.page.locator("#status_filter, [name='status']");
    await statusFilter.click();
    await this.page.getByRole("option", { name: status }).click();
    await this.waitForTableLoad();
  }

  /**
   * Filter events by date range
   */
  async filterByDateRange(startDate: string, endDate: string): Promise<void> {
    await this.page.locator("#start_date_input").fill(startDate);
    await this.page.locator("#end_date_input").fill(endDate);
    const applyButton = this.page.getByRole("button", {
      name: /apply|filter/i,
    });
    await applyButton.click();
    await this.waitForTableLoad();
  }

  /**
   * Verify event in table
   */
  async verifyEventExists(eventData: string): Promise<void> {
    const eventRow = this.page.locator(`tr:has-text("${eventData}")`);
    await expect(eventRow).toBeVisible();
  }
}
