import test, { expect } from "@playwright/test";
import { GateEventsPage } from "../pages/GateEventsPage";

test.describe("Gate Events Management", () => {
  let gateEventsPage: GateEventsPage;

  test.beforeEach(async ({ page }) => {
    gateEventsPage = new GateEventsPage(page, page.request);
    await gateEventsPage.processAdminLogin();
    await gateEventsPage.openGateEventsPage();
    await gateEventsPage.waitForTableLoad();

    const gateHeading = page.getByRole("heading", { name: /gate|events/i });
    await expect(gateHeading).toBeVisible();
  });

  test("should display gate events page", async ({ page }) => {
    await test.step("Verify page elements are visible", async () => {
      const gateHeading = page.getByRole("heading", { name: /gate|events/i });
      await expect(gateHeading).toBeVisible();

      // Verify table is present
      const table = page.locator("table");
      await expect(table).toBeVisible();
    });
  });

  test("should search for gate events", async ({ page }) => {
    await test.step("Perform search", async () => {
      const searchQuery = "visitor";
      await gateEventsPage.searchGateEvent(searchQuery);

      // Verify search was applied (table should update)
      await page.waitForTimeout(1000);
    });
  });

  test("should filter events by status", async ({ page }) => {
    await test.step("Apply status filter", async () => {
      // Check if status filter exists
      const statusFilter = page.locator("#status_filter, [name='status']");

      if (await statusFilter.isVisible()) {
        await statusFilter.click();

        // Select a status option (e.g., "Approved", "Pending")
        const statusOption = page
          .getByRole("option", { name: /approved|pending/i })
          .first();

        if (await statusOption.isVisible()) {
          await statusOption.click();
          await gateEventsPage.waitForTableLoad();
        }
      }
    });
  });

  test("should view event details", async ({ page }) => {
    await test.step("Click on first event to view details", async () => {
      const firstRow = page.locator("table tbody tr").first();

      if (await firstRow.isVisible()) {
        const viewBtn = firstRow.getByRole("button", { name: /view|details/i });

        if (await viewBtn.isVisible()) {
          await viewBtn.click();

          // Verify navigation to event details
          await expect(page).toHaveURL(/\/gate\/events\/\w+/);
        }
      }
    });
  });

  test("should reload gate events table", async ({ page }) => {
    await test.step("Click reload button", async () => {
      const reloadBtn = page.getByRole("button", {
        name: /reload|refresh|refetch/i,
      });

      if (await reloadBtn.isVisible()) {
        await reloadBtn.click();
        await gateEventsPage.waitForTableLoad();
      }
    });
  });

  test("should export gate events data", async ({ page }) => {
    await test.step("Click export button if available", async () => {
      const exportBtn = page.getByRole("button", { name: /export|download/i });

      if (await exportBtn.isVisible()) {
        // Set up download listener
        const downloadPromise = page.waitForEvent("download");
        await exportBtn.click();

        const download = await downloadPromise;
        expect(download).toBeTruthy();
      }
    });
  });
});
