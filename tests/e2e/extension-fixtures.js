import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, test as base, expect } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const extensionPath = path.resolve(__dirname, "..", "..");

async function seedExtensionSettings(page, buildingApiKey) {
  await page.evaluate(async (settings) => {
    await chrome.storage.local.set({ extensionSettings: settings });
  }, {
    theme: "system",
    templateStorageArea: "local",
    clipboardWriteEnabled: true,
    buildingApiKey,
  });
}

export async function openSidepanelPage(context, extensionId, buildingApiKey = "playwright-test-key") {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await page.waitForLoadState("domcontentloaded");
  await seedExtensionSettings(page, buildingApiKey);
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await page.locator("#navSearch").waitFor();
  return page;
}

export const test = base.extend({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers();

    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent("serviceworker");
    }

    const extensionId = new URL(serviceWorker.url()).host;
    await use(extensionId);
  },

  sidepanelPage: async ({ context, extensionId }, use) => {
    const page = await openSidepanelPage(context, extensionId);
    await use(page);
    await page.close();
  },
});

export { expect };
