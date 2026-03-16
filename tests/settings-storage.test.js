import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_SETTINGS,
  evaluateSyncTemplatePayload,
  getExtensionSettings,
  migrateTemplatesToStorageArea,
  resolveAppliedTheme,
  saveExtensionSettings,
  saveTemplatesToStorage,
} from "../storage-utils.js";

function createStorageArea(initialData = {}, quotaBytes = 102400, quotaBytesPerItem = 8192) {
  const store = new Map(Object.entries(initialData));

  return {
    QUOTA_BYTES: quotaBytes,
    QUOTA_BYTES_PER_ITEM: quotaBytesPerItem,
    async get(keys) {
      if (keys === null) {
        return Object.fromEntries(store.entries());
      }

      const keyList = Array.isArray(keys) ? keys : [keys];
      const result = {};

      for (const key of keyList) {
        if (store.has(key)) {
          result[key] = store.get(key);
        }
      }

      return result;
    },
    async set(values) {
      Object.entries(values).forEach(([key, value]) => {
        store.set(key, value);
      });
    },
    async remove(key) {
      store.delete(key);
    },
    async getBytesInUse(key) {
      const data = key === null ? Object.fromEntries(store.entries()) : { [key]: store.get(key) };
      return new TextEncoder().encode(JSON.stringify(data)).length;
    },
  };
}

function installChromeMock({ localData = {}, syncData = {}, syncQuotaBytes = 102400, syncQuotaBytesPerItem = 8192 } = {}) {
  globalThis.chrome = {
    storage: {
      local: createStorageArea(localData),
      sync: createStorageArea(syncData, syncQuotaBytes, syncQuotaBytesPerItem),
    },
  };
}

test("getExtensionSettings returns the default settings when nothing is stored", async () => {
  installChromeMock();

  const settings = await getExtensionSettings();

  assert.deepEqual(settings, DEFAULT_SETTINGS);
});

test("saveExtensionSettings persists a trimmed building API key", async () => {
  installChromeMock();

  const settings = await saveExtensionSettings({
    buildingApiKey: "  sample-service-key  ",
  });

  const stored = await chrome.storage.local.get(["extensionSettings"]);

  assert.equal(settings.buildingApiKey, "sample-service-key");
  assert.equal(stored.extensionSettings.buildingApiKey, "sample-service-key");
});

test("saveExtensionSettings allows clearing the building API key", async () => {
  installChromeMock({
    localData: {
      extensionSettings: {
        ...DEFAULT_SETTINGS,
        buildingApiKey: "existing-key",
      },
    },
  });

  const settings = await saveExtensionSettings({
    buildingApiKey: "   ",
  });

  assert.equal(settings.buildingApiKey, "");
});

test("resolveAppliedTheme follows the system preference only for system theme", () => {
  assert.equal(resolveAppliedTheme("system", true), "dark");
  assert.equal(resolveAppliedTheme("system", false), "light");
  assert.equal(resolveAppliedTheme("dark", false), "dark");
  assert.equal(resolveAppliedTheme("light", true), "light");
});

test("evaluateSyncTemplatePayload reports when a payload exceeds sync item limits", () => {
  const largeTemplates = [
    { id: "tpl_1", title: "큰 템플릿", body: "A".repeat(200) },
  ];

  const evaluation = evaluateSyncTemplatePayload(largeTemplates, {
    totalBytes: 256,
    perItemBytes: 64,
  });

  assert.equal(evaluation.fits, false);
  assert.equal(evaluation.fitsPerItem, false);
});

test("migrateTemplatesToStorageArea preserves templates and updates the active area on success", async () => {
  const templates = [
    { id: "tpl_1", title: "인사", body: "안녕하세요" },
    { id: "tpl_2", title: "보고", body: "월간 공정보고입니다." },
  ];

  installChromeMock({
    localData: {
      extensionSettings: {
        theme: "system",
        templateStorageArea: "local",
        clipboardWriteEnabled: true,
      },
      userTemplates: templates,
    },
    syncQuotaBytes: 4096,
    syncQuotaBytesPerItem: 4096,
  });

  const result = await migrateTemplatesToStorageArea("sync");
  const syncTemplates = await chrome.storage.sync.get(["userTemplates"]);
  const localSettings = await chrome.storage.local.get(["extensionSettings"]);

  assert.equal(result.changed, true);
  assert.deepEqual(syncTemplates.userTemplates, templates);
  assert.equal(localSettings.extensionSettings.templateStorageArea, "sync");
});

test("migrateTemplatesToStorageArea leaves the active area unchanged when sync quota is exceeded", async () => {
  installChromeMock({
    localData: {
      extensionSettings: {
        theme: "system",
        templateStorageArea: "local",
        clipboardWriteEnabled: true,
      },
      userTemplates: [
        { id: "tpl_1", title: "초과", body: "B".repeat(400) },
      ],
    },
    syncQuotaBytes: 256,
    syncQuotaBytesPerItem: 128,
  });

  await assert.rejects(
    migrateTemplatesToStorageArea("sync"),
    /동기화 저장소 한도/,
  );

  const localSettings = await chrome.storage.local.get(["extensionSettings"]);
  const syncTemplates = await chrome.storage.sync.get(["userTemplates"]);

  assert.equal(localSettings.extensionSettings.templateStorageArea, "local");
  assert.equal(syncTemplates.userTemplates, undefined);
});

test("saveTemplatesToStorage rejects oversize sync writes before persistence", async () => {
  installChromeMock({
    syncQuotaBytes: 256,
    syncQuotaBytesPerItem: 128,
  });

  await assert.rejects(
    saveTemplatesToStorage("sync", [
      { id: "tpl_1", title: "초과", body: "C".repeat(400) },
    ]),
    /동기화 저장소 한도/,
  );

  const syncTemplates = await chrome.storage.sync.get(["userTemplates"]);
  assert.equal(syncTemplates.userTemplates, undefined);
});
