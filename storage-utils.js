export const SETTINGS_KEY = "extensionSettings";
export const USER_TEMPLATES_KEY = "userTemplates";

export const DEFAULT_SETTINGS = Object.freeze({
  theme: "system",
  clipboardWriteEnabled: true,
  buildingApiKey: "",
  konepsApiKey: "",
});

const VALID_THEMES = new Set(["light", "dark", "system"]);

export function normalizeSettings(rawSettings = {}) {
  return {
    theme: VALID_THEMES.has(rawSettings?.theme)
      ? rawSettings.theme
      : DEFAULT_SETTINGS.theme,
    clipboardWriteEnabled:
      typeof rawSettings?.clipboardWriteEnabled === "boolean"
        ? rawSettings.clipboardWriteEnabled
        : DEFAULT_SETTINGS.clipboardWriteEnabled,
    buildingApiKey:
      typeof rawSettings?.buildingApiKey === "string"
        ? rawSettings.buildingApiKey.trim()
        : DEFAULT_SETTINGS.buildingApiKey,
    konepsApiKey:
      typeof rawSettings?.konepsApiKey === "string"
        ? rawSettings.konepsApiKey.trim()
        : DEFAULT_SETTINGS.konepsApiKey,
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

export async function getTemplatesFromStorage() {
  const result = await chrome.storage.local.get([USER_TEMPLATES_KEY]);
  const templates = result[USER_TEMPLATES_KEY];

  return Array.isArray(templates) ? templates : [];
}

export async function saveTemplatesToStorage(templates) {
  await chrome.storage.local.set({ [USER_TEMPLATES_KEY]: templates });
}
