import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const baseUrl = process.env.BASE_URL || "http://localhost:3101";
const evidenceDir = new URL("../docs/evidence/oh01-foundations/", import.meta.url);
const date = "2026-11-08";
const viewports = [
  { name: "320", width: 320, height: 960 },
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 900 },
  { name: "1440", width: 1440, height: 1000 },
];

await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) =>
      pageErrors.push({
        message: error.message,
        stack: error.stack,
      }),
    );

    const response = await page.goto(`${baseUrl}/design-system/`, {
      waitUntil: "networkidle",
    });
    await page.getByRole("heading", { level: 1 }).waitFor();

    const layout = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      bodyWidth: document.body.scrollWidth,
    }));

    await page.screenshot({
      path: new URL(`${date}-gallery-${viewport.name}.png`, evidenceDir).pathname,
      fullPage: true,
    });

    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      label:
        document.activeElement?.getAttribute("aria-label") ||
        document.activeElement?.textContent?.trim().slice(0, 80),
    }));

    if (viewport.name === "390" || viewport.name === "1440") {
      await page.getByRole("button", { name: "Open property details" }).click();
      await page.getByRole("dialog", { name: "Cedar Court" }).waitFor();
      await page.screenshot({
        path: new URL(
          `${date}-drawer-${viewport.name}.png`,
          evidenceDir,
        ).pathname,
        fullPage: false,
      });
      await page.keyboard.press("Escape");
      await page.getByRole("dialog", { name: "Cedar Court" }).waitFor({
        state: "detached",
      });
    }

    report.push({
      viewport: viewport.name,
      status: response?.status(),
      ...layout,
      horizontalOverflow: layout.documentWidth > layout.viewportWidth,
      focus,
      pageErrors,
    });
    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(
  new URL(`${date}-report.json`, evidenceDir),
  `${JSON.stringify(report, null, 2)}\n`,
);

const failures = report.filter(
  (entry) =>
    entry.horizontalOverflow ||
    entry.pageErrors.length > 0 ||
    entry.status !== 200,
);
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Captured ${report.length} viewports with no overflow or page errors.`);
}
