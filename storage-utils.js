export const SETTINGS_KEY = "extensionSettings";
export const USER_TEMPLATES_KEY = "userTemplates";

export const DEFAULT_SETTINGS = Object.freeze({
  theme: "system",
  templateStorageArea: "local",
  clipboardWriteEnabled: true,
  buildingApiKey: "",
});

export const DEFAULT_SYNC_LIMITS = Object.freeze({
  totalBytes: 102400,
  perItemBytes: 8192,
});

const VALID_THEMES = new Set(["light", "dark", "system"]);
const VALID_STORAGE_AREAS = new Set(["local", "sync"]);

export function normalizeSettings(rawSettings = {}) {
  return {
    theme: VALID_THEMES.has(rawSettings?.theme)
      ? rawSettings.theme
      : DEFAULT_SETTINGS.theme,
    templateStorageArea: VALID_STORAGE_AREAS.has(rawSettings?.templateStorageArea)
      ? rawSettings.templateStorageArea
      : DEFAULT_SETTINGS.templateStorageArea,
    clipboardWriteEnabled:
      typeof rawSettings?.clipboardWriteEnabled === "boolean"
        ? rawSettings.clipboardWriteEnabled
        : DEFAULT_SETTINGS.clipboardWriteEnabled,
    buildingApiKey:
      typeof rawSettings?.buildingApiKey === "string"
        ? rawSettings.buildingApiKey.trim()
        : DEFAULT_SETTINGS.buildingApiKey,
  };
}

export function resolveAppliedTheme(theme, prefersDark) {
  if (theme === "dark") {
    return "dark";
  }

  if (theme === "light") {
    return "light";
  }

  return prefersDark ? "dark" : "light";
}

export function templatesAreEqual(sourceTemplates, targetTemplates) {
  return JSON.stringify(sourceTemplates) === JSON.stringify(targetTemplates);
}

export function evaluateSyncTemplatePayload(templates, limits = DEFAULT_SYNC_LIMITS) {
  const bytes = new TextEncoder().encode(
    JSON.stringify({ [USER_TEMPLATES_KEY]: templates }),
  ).length;

  return {
    bytes,
    fitsPerItem: bytes <= limits.perItemBytes,
    fitsTotal: bytes <= limits.totalBytes,
    fits: bytes <= limits.perItemBytes && bytes <= limits.totalBytes,
  };
}

export function getSyncQuotaDetails() {
  return {
    totalBytes: chrome.storage.sync.QUOTA_BYTES ?? DEFAULT_SYNC_LIMITS.totalBytes,
    perItemBytes:
      chrome.storage.sync.QUOTA_BYTES_PER_ITEM ?? DEFAULT_SYNC_LIMITS.perItemBytes,
  };
}

function getStorageArea(areaName) {
  return areaName === "sync" ? chrome.storage.sync : chrome.storage.local;
}

export async function getExtensionSettings() {
  const result = await chrome.storage.local.get([SETTINGS_KEY]);
  const settings = normalizeSettings(result[SETTINGS_KEY]);

  if (!result[SETTINGS_KEY] || JSON.stringify(result[SETTINGS_KEY]) !== JSON.stringify(settings)) {
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  }

  return settings;
}

export async function saveExtensionSettings(partialSettings) {
  const currentSettings = await getExtensionSettings();
  const nextSettings = normalizeSettings({
    ...currentSettings,
    ...partialSettings,
  });

  await chrome.storage.local.set({ [SETTINGS_KEY]: nextSettings });
  return nextSettings;
}

export async function getTemplatesFromStorage(areaName) {
  const storageArea = getStorageArea(areaName);
  const result = await storageArea.get([USER_TEMPLATES_KEY]);
  const templates = result[USER_TEMPLATES_KEY];

  return Array.isArray(templates) ? templates : [];
}

export async function saveTemplatesToStorage(areaName, templates) {
  if (areaName === "sync") {
    const quotaDetails = getSyncQuotaDetails();
    const evaluation = evaluateSyncTemplatePayload(templates, quotaDetails);

    if (!evaluation.fits) {
      const currentSizeKb = (evaluation.bytes / 1024).toFixed(1);
      const maxSizeKb = (quotaDetails.perItemBytes / 1024).toFixed(1);
      throw new Error(
        `템플릿 데이터가 동기화 저장소 한도(${maxSizeKb}KB)를 초과했습니다. 현재 크기: ${currentSizeKb}KB`,
      );
    }
  }

  const storageArea = getStorageArea(areaName);
  await storageArea.set({ [USER_TEMPLATES_KEY]: templates });
}

async function removeTemplatesFromStorage(areaName) {
  const storageArea = getStorageArea(areaName);
  await storageArea.remove(USER_TEMPLATES_KEY);
}

export async function getActiveTemplateStorageArea() {
  const settings = await getExtensionSettings();
  return settings.templateStorageArea;
}

export async function migrateTemplatesToStorageArea(targetAreaName) {
  const settings = await getExtensionSettings();
  const sourceAreaName = settings.templateStorageArea;

  if (!VALID_STORAGE_AREAS.has(targetAreaName)) {
    throw new Error("지원하지 않는 저장소 타입입니다.");
  }

  if (targetAreaName === sourceAreaName) {
    return {
      changed: false,
      settings,
      migratedTemplates: await getTemplatesFromStorage(targetAreaName),
    };
  }

  const sourceTemplates = await getTemplatesFromStorage(sourceAreaName);

  await saveTemplatesToStorage(targetAreaName, sourceTemplates);
  const migratedTemplates = await getTemplatesFromStorage(targetAreaName);

  if (!templatesAreEqual(sourceTemplates, migratedTemplates)) {
    await removeTemplatesFromStorage(targetAreaName);
    throw new Error("저장소 전환 검증에 실패했습니다.");
  }

  const nextSettings = await saveExtensionSettings({
    templateStorageArea: targetAreaName,
  });

  return {
    changed: true,
    settings: nextSettings,
    migratedTemplates,
  };
}
