2026-03-16 Task 1
- Current verification baseline is strong at pure Node logic level (`npm test`, syntax checks) but has zero browser-runtime proof for the sidepanel split UX.
- The repo already contains the extracted lookup module and unit tests, which makes Playwright harness work a natural next step.

2026-03-16 Task 2
- Playwright MV3 extension tests work with `@playwright/test` plus `chromium.launchPersistentContext("", { channel: "chromium", args: [--disable-extensions-except, --load-extension] })`.
- The most reliable smoke path is to derive the extension id from the MV3 service worker and navigate directly to `chrome-extension://<id>/sidepanel.html`.
- Modal-close focus behavior was not preserving `bunInput` focus until it was deferred to the dialog `close` event.

2026-03-16 Task 3
- The dedicated-page finder and modal finder can be tested independently by scoping locators to `#legalDongFinderMount` and `#codeLookupDlg`.
- Building-search runtime coverage is stable when the public API call is mocked with `page.route("**/getBrTitleInfo**")`, which keeps the suite deterministic while still exercising loading/result UI.
- Escape-close and backdrop-click close both restore trigger focus correctly after the recent modal-focus fix.

2026-03-16 Task 4
- `docs/frontend.md` needed a broader sync than README because the navigation order, view count, modal count, and building-search composition all changed together.
- Active-doc stale selector drift is now cleared: removed accordion IDs are no longer documented as current UI elements.

2026-03-16 Task 5
- A staged packaging flow is safer than zipping the repo root directly because it can limit output to runtime files and sanitize manifest entries that refer to missing assets.
- The current repo packages cleanly with `images/*`, `address-codes.json`, and `default-templates.json`; `icons/*` can be dropped from the packaged manifest because there is no `icons/` directory.

2026-03-16 Task 6
- Seeding `chrome.storage.local.extensionSettings` before reloading `sidepanel.html` keeps Playwright deterministic while matching the real settings-loading path.
- The safest near-term API-key hardening here is client-side stored configuration plus a fail-fast UI message before any network request leaves the extension.
