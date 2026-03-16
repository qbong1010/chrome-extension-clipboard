2026-03-16 Task 1
- Treat the current dirty worktree as the execution baseline because it contains the latest UX split changes the stabilization plan is meant to verify.
- Proceed to Task 2 without waiting for doc cleanup, since Playwright runtime proof is the first gating milestone.

2026-03-16 Task 2
- Reused a dedicated `tests/e2e/extension-fixtures.js` fixture so Task 3 can extend the same MV3 loading and extension-id discovery path instead of reimplementing it.
- Added `test:e2e` to `package.json` and Playwright artifact directories to `.gitignore` to make runtime verification repeatable.

2026-03-16 Task 3
- Chose to validate building-search submission with a mocked API response instead of the live public endpoint to avoid network/API-key flakiness while still exercising loading, result rendering, and selection persistence.

2026-03-16 Task 4
- Added a new top changelog entry (`1.5.2`) instead of mutating historical release notes so release history stays append-only.

2026-03-16 Task 5
- Implemented packaging as a Node script (`scripts/package-extension.mjs`) so the release artifact can be reproduced with one command and without depending on manual zip steps.
- Sanitized `web_accessible_resources` in the packaged manifest instead of changing the source manifest during the packaging task.

2026-03-16 Task 6
- Replaced the embedded API key with a stored `buildingApiKey` setting and kept `host_permissions: <all_urls>` unchanged for now, documenting the reason in the release checklist instead of making an unverified permission cut.
