import { Page } from "@playwright/test";

export class TestTagStorage {
  constructor(private page: Page) {}

  private readonly storageKey = "test_suite_tag";

  async generateUniqueId(prefix: string): Promise<string> {
    return await this.page.evaluate((prefix) => {
      const uniqueId = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      return uniqueId;
    }, prefix);
  }

  async generateOrGetTag(): Promise<string> {
    return await this.page.evaluate((key) => {
      let value = localStorage.getItem(key);
      if (!value) {
        value = `test_suite_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        console.log("Generated test tag:", value);
        localStorage.setItem(key, value);
      }
      return value;
    }, this.storageKey);
  }

  async getTag(): Promise<string | null> {
    return await this.page.evaluate(
      (key) => localStorage.getItem(key),
      this.storageKey,
    );
  }

  async clearTag(): Promise<void> {
    await this.page.evaluate(
      (key) => localStorage.removeItem(key),
      this.storageKey,
    );
  }

  async setTag(value: string): Promise<void> {
    await this.page.evaluate(({ key, val }) => localStorage.setItem(key, val), {
      key: this.storageKey,
      val: value,
    });
  }
}
