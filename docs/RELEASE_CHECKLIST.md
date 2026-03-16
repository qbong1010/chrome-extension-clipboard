# Release Checklist

## Before Packaging

- Bump `manifest.json` version for the release candidate.
- Run `npm test`.
- Run `node --check sidepanel.js building-code-lookup.js storage-utils.js background.js tests/building-code-lookup.test.js`.
- Run `npx playwright test tests/e2e/sidepanel-code-lookup.spec.js --project=chromium`.
- Confirm `README.md`, `docs/frontend.md`, and `docs/CHANGELOG.md` reflect the current dedicated page + modal code lookup flow.

## Package Command

```bash
npm run package:extension
```

Expected artifact:

- `dist/paste-right-v<manifest.version>.zip`

## Package Verification

- Inspect the archive contents and confirm it includes:
  - `manifest.json`
  - `sidepanel.html`
  - `sidepanel.js`
  - `background.js`
  - `storage-utils.js`
  - `building-code-lookup.js`
  - `iframe-content.js`
  - `styles/sidepanel.css`
  - `libs/Sortable.js`
  - `images/donate_qr.jpg`
  - `address-codes.json`
  - `default-templates.json`
- If `icons/` does not exist in the repo, verify the packaged `manifest.json` no longer exposes the stale `icons/*` web-accessible resource entry.

## Release Evidence

- Preserve `playwright-report/index.html`.
- Preserve `test-results/` when a failure needs investigation.
- Save archive listing evidence to `.sisyphus/evidence/task-5-package-list.txt`.

## Permission Scope Note

- `host_permissions: <all_urls>` is intentionally unchanged in this stabilization cycle.
- Reason: the current `iframe-content.js` insertion flow and runtime messaging surface still need a dedicated permission audit before scope reduction.
- Tighten host permissions only after that audit and after rerunning the Playwright/runtime verification flow for any affected content-script behavior.

## Stop Conditions

- Do not package if `npm test` fails.
- Do not package if the Playwright suite fails.
- Do not package if the archive is missing any runtime file declared by `manifest.json`.
