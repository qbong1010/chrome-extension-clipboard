# Post UX Split Stabilization Plan

## TL;DR
> **Summary**: Stabilize the recently split code-lookup UX before adding more features. Prioritize browser-runtime proof, docs alignment, release readiness, and security/config hardening in that order.
> **Deliverables**:
> - Browser-level regression coverage for sidepanel code-lookup and building-search flows
> - Updated README/docs/changelog that match the current dedicated page + modal UX
> - Release-readiness checklist with packaging/runtime verification
> - API key and permission hardening plan implemented to the selected near-term model
> **Effort**: Medium
> **Parallel**: YES - 2 waves
> **Critical Path**: Baseline audit -> Playwright harness -> Runtime regression coverage -> Docs sync -> Release checklist -> Security hardening

## Context
### Original Request
- Create a senior-PM style plan for what work should happen next after the recent Chrome extension sidepanel UX changes.

### Interview Summary
- Recent work split address-based code lookup into a dedicated `법정동 코드 찾기` page and a modal launched from `건축물대장 조회`.
- The building-search page now emphasizes direct lookup while preserving address-based code filling through a grouped help affordance.
- Current repo verification is still mostly `node --test` plus syntax checks; no browser automation is present.
- Defaults applied for planning: target the next milestone as an internal stabilization release, keep both the dedicated page and modal as permanent surfaces, and use a user/config-supplied API key as the near-term hardening model instead of introducing a backend proxy.

### Metis Review (gaps addressed)
- Treat the next cycle as stabilization, not feature expansion.
- Make docs/changelog synchronization part of the release surface, not optional cleanup.
- Add browser-level validation before optional follow-up work.
- Defer broad refactors and optional features unless testability blocks execution.

## Work Objectives
### Core Objective
- Ship a stabilization-ready build of the current sidepanel UX split with runtime proof, accurate docs, release packaging guidance, and a safer config/security posture.

### Deliverables
- `tests/e2e/*` browser automation for critical sidepanel flows
- Updated user-facing and engineering docs reflecting the dedicated page + modal code-lookup flow
- Packaging and release checklist artifacts with commands and evidence expectations
- Hardened API-key handling path and reviewed permission scope for the chosen milestone

### Definition of Done (verifiable conditions with commands)
- `npm test`
- `node --check sidepanel.js && node --check building-code-lookup.js && node --check storage-utils.js && node --check background.js`
- `npx playwright test tests/e2e/sidepanel-code-lookup.spec.js --project=chromium`
- `rg -n "주소로 코드 찾기 섹션|finderHeader|finderToggle|addressSearchInput|addressSearchBtn" README.md docs`
- `rg -n "const API_KEY|0432b6814606f51e00ba673c512ed8973ff859a6ed723fa5591b736c76be31fb" sidepanel.js docs`

### Must Have
- Browser-level proof that the new nav/page/modal flows work in an unpacked MV3 extension runtime
- Documentation that matches the current UX and test commands
- A release checklist that covers manifest/version/package/runtime checks
- A near-term security improvement that removes the embedded API key from source or gates release on the replacement path

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- No new end-user features beyond stabilization needs
- No broad `sidepanel.js` refactor unless required to make tests executable
- No Chrome Web Store asset work, template-delete work, address-data optimization, or analytics rollout in this cycle
- No acceptance criteria that rely on human visual inspection

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: TDD + tests-after for docs/release tasks; Node built-in test runner plus Playwright for browser runtime coverage
- QA policy: Every task includes agent-executed happy-path and failure-path scenarios
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}` and Playwright default artifacts in `playwright-report/` and `test-results/`

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. Shared dependencies are pulled forward.

Wave 1: baseline audit, Playwright harness, docs drift inventory
Wave 2: runtime negative-path coverage, docs sync, release checklist, security hardening

### Dependency Matrix (full, all tasks)
- Task 1 blocks Tasks 2, 4, 5, 6 by capturing baseline evidence and exact drift
- Task 2 blocks Task 3 by establishing extension runtime automation
- Task 3 informs Task 5 and Task 6 with real release-risk findings
- Task 4 can run in parallel with Task 3 after Task 1
- Task 5 depends on Tasks 1, 3, and 4
- Task 6 depends on Tasks 1 and 5; reruns Task 3 coverage after manifest/config changes

### Agent Dispatch Summary (wave -> task count -> categories)
- Wave 1 -> 2 tasks -> `quick`, `unspecified-high`
- Wave 2 -> 4 tasks -> `unspecified-high`, `writing`, `quick`, `deep`

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Capture Baseline Release-Risk Evidence

  **What to do**: Record the current repo state before stabilization work begins. Capture command output for unit tests, syntax checks, manifest permissions/version, current doc drift, and current source-secret exposure. Save the findings into evidence files so later tasks can prove improvement against a known baseline.
  **Must NOT do**: Do not change feature behavior in this task. Do not add new tests or docs yet. Do not normalize docs by hand inside the evidence capture step.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Mostly command execution, evidence capture, and drift inventory
  - Skills: `[]` - No special skill needed
  - Omitted: `playwright` - Not needed until the runtime harness task exists

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 2, 4, 5, 6 | Blocked By: none

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `package.json:6` - Current only test script is `node --test`
  - Pattern: `manifest.json:9` - Current MV3 side panel entrypoint
  - Pattern: `manifest.json:13` - Current permissions list to audit and justify
  - Pattern: `README.md:52` - Old building-search usage text still describes inline code lookup
  - Pattern: `docs/frontend.md:157` - Still documents removed accordion IDs and structure
  - Pattern: `docs/IMPLEMENTATION_COMPLETE.md:248` - Current validation claims are limited to unit tests and syntax checks
  - Pattern: `docs/PROJECT_CONTEXT.md:340` - Existing technical-debt and risk inventory
  - API/Type: `sidepanel.js:503` - Embedded API key baseline to eliminate later

  **Acceptance Criteria** (agent-executable only):
  - [ ] `.sisyphus/evidence/task-1-baseline-tests.txt` contains `npm test` output with exit code captured
  - [ ] `.sisyphus/evidence/task-1-baseline-syntax.txt` contains syntax-check output for `sidepanel.js`, `building-code-lookup.js`, `storage-utils.js`, and `background.js`
  - [ ] `.sisyphus/evidence/task-1-baseline-doc-drift.txt` contains grep results proving current README/docs drift around the old inline lookup flow
  - [ ] `.sisyphus/evidence/task-1-baseline-security.txt` contains grep results for the embedded API key and manifest permission snapshot

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```text
  Scenario: Baseline evidence capture completes
    Tool: Bash
    Steps: Run `npm test`; run `node --check sidepanel.js && node --check building-code-lookup.js && node --check storage-utils.js && node --check background.js`; run `rg -n "주소로 코드 찾기 섹션|finderHeader|finderToggle|addressSearchInput|addressSearchBtn" README.md docs`; run `rg -n "const API_KEY|0432b6814606f51e00ba673c512ed8973ff859a6ed723fa5591b736c76be31fb|<all_urls>" sidepanel.js manifest.json docs`; save outputs into task-1 evidence files.
    Expected: All four evidence files exist and clearly show current pass/fail baseline and drift points.
    Evidence: .sisyphus/evidence/task-1-baseline.txt

  Scenario: Drift search catches stale docs
    Tool: Bash
    Steps: Search README and docs for removed accordion terms and old inline flow language before any doc updates.
    Expected: At least one stale match is present in `README.md` and at least one stale match is present in `docs/frontend.md`.
    Evidence: .sisyphus/evidence/task-1-baseline-doc-drift.txt
  ```

  **Commit**: NO | Message: `n/a` | Files: `.sisyphus/evidence/*`

- [x] 2. Add Playwright MV3 Sidepanel Smoke Harness

  **What to do**: Introduce Playwright-based extension runtime automation for Chromium, including the exact launch flow for the unpacked extension and one happy-path smoke spec covering the current code-lookup split. The first spec must prove nav switching, modal open, address search, result selection, input fill, and focus behavior.
  **Must NOT do**: Do not replace existing Node unit tests. Do not add broad UI refactors. Do not automate unrelated template-management features in this first browser harness task.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: New browser automation infrastructure plus extension-runtime setup
  - Skills: `playwright` - Required for browser automation and artifact capture
  - Omitted: `frontend-ui-ux` - No UI redesign work is needed here

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 3 | Blocked By: 1

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `manifest.json:9` - Extension uses `side_panel.default_path` and must be loaded as MV3
  - Pattern: `sidepanel.html:20` - Building-search nav entry selector target
  - Pattern: `sidepanel.html:23` - Dedicated code-finder nav entry selector target
  - Pattern: `sidepanel.html:159` - Shared help rail and `#openCodeLookupBtn`
  - Pattern: `sidepanel.html:217` - Dedicated `legalDongCodeView`
  - Pattern: `sidepanel.js:440` - Target-based view switching logic
  - Pattern: `sidepanel.js:656` - Modal open/close/focus-restore wiring for `codeLookupDlg`
  - Test: `tests/building-code-lookup.test.js:32` - Concrete known-good lookup data and expected codes
  - External: `https://developer.chrome.com/docs/extensions/how-to/test/end-to-end-testing` - Official extension E2E guidance
  - External: `https://developer.chrome.com/docs/extensions/reference/api/sidePanel` - Side Panel API behavior and constraints

  **Acceptance Criteria** (agent-executable only):
  - [ ] `playwright.config.*` exists and launches Chromium with the unpacked extension loaded from repo root
  - [ ] `tests/e2e/sidepanel-code-lookup.spec.js` exists and runs with `npx playwright test tests/e2e/sidepanel-code-lookup.spec.js --project=chromium`
  - [ ] The smoke test asserts `#navSearch`, `#navCodeFinder`, `#openCodeLookupBtn`, `[data-role="address-search-input"]`, `.result-item-select`, `#sigunguInput`, `#bjdongInput`, and `#bunInput`
  - [ ] `playwright-report/` or `test-results/` contains artifacts from a green run

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```text
  Scenario: Happy-path sidepanel smoke test passes
    Tool: Playwright
    Steps: Load Chromium with the unpacked extension; open the side panel; click `#navSearch`; click `#openCodeLookupBtn`; type `경기도 남양주시 금곡동` into `[data-role="address-search-input"]`; click the first `.result-item-select`; assert `#sigunguInput` is `41360`; assert `#bjdongInput` is `10300`; assert `#bunInput` is focused; assert `#codeLookupDlg` is closed.
    Expected: The full flow passes in a real extension runtime with no uncaught error.
    Evidence: .sisyphus/evidence/task-2-sidepanel-smoke.txt

  Scenario: Harness fails loudly on extension load issues
    Tool: Playwright
    Steps: Intentionally point the unpacked-extension loader to a bad path or break the manifest path inside a dry-run branch of the test harness.
    Expected: The harness exits non-zero with a clear extension load/setup error instead of hanging silently.
    Evidence: .sisyphus/evidence/task-2-sidepanel-smoke-error.txt
  ```

  **Commit**: YES | Message: `test(extension): add sidepanel runtime smoke coverage` | Files: `playwright.config.*`, `tests/e2e/*`, `package.json`

- [x] 3. Cover Negative Paths and Cross-View Runtime Regressions

  **What to do**: Extend the Playwright suite to cover failure and edge paths specific to the new split UX: short keyword/no-result behavior, dialog close behavior, focus restoration, standalone page selection persistence, and a post-selection building-search submission smoke path.
  **Must NOT do**: Do not broaden into full app E2E coverage. Do not test template CRUD in this cycle. Do not accept partial assertions that ignore focus and dialog state.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Runtime regression coverage with nuanced UI states
  - Skills: `playwright` - Required for dialog/focus assertions
  - Omitted: `dev-browser` - Persistent ad hoc browser state is less useful than repeatable Playwright specs

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 5, 6 | Blocked By: 2

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `sidepanel.html:159` - Help rail trigger for the modal
  - Pattern: `sidepanel.html:217` - Dedicated `법정동 코드 찾기` page mount
  - Pattern: `sidepanel.js:587` - Shared selection application helper
  - Pattern: `sidepanel.js:617` - Search execution and toast/error path
  - Pattern: `sidepanel.js:666` - Dialog close and focus restoration behavior
  - Pattern: `sidepanel.js:954` - Building-search submission path to smoke after autofill
  - Test: `tests/building-code-lookup.test.js:49` - One-character keyword should return `[]`
  - External: `https://developer.chrome.com/docs/extensions/how-to/test/end-to-end-testing` - Official browser test patterns for extension UIs

  **Acceptance Criteria** (agent-executable only):
  - [ ] Runtime test covers a one-character keyword path and verifies no crash plus explicit empty/no-result UI handling
  - [ ] Runtime test verifies Escape or backdrop close returns focus to `#openCodeLookupBtn`
  - [ ] Runtime test verifies selecting from `#navCodeFinder` still populates `#sigunguInput` and `#bjdongInput` after navigating back to `#navSearch`
  - [ ] Runtime test verifies entering `bun=0685` and `ji=0017` after autofill reaches loading state and then either result or handled error state without JS crash

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```text
  Scenario: Negative and cross-view runtime assertions pass
    Tool: Playwright
    Steps: Open `#navCodeFinder`; search `금`; verify the no-result or zero-result state without runtime error; return to `#navSearch`; open `#codeLookupDlg`; dismiss with Escape and assert focus returns to `#openCodeLookupBtn`; reopen the dialog; perform a valid selection; enter `0685` and `0017`; click `#searchBtn`; assert loading and then a handled terminal state.
    Expected: All assertions pass and the extension remains interactive.
    Evidence: .sisyphus/evidence/task-3-runtime-regressions.txt

  Scenario: Backdrop dismissal does not trap focus
    Tool: Playwright
    Steps: Open `#codeLookupDlg`; click the backdrop area; verify the dialog closes and `document.activeElement.id === "openCodeLookupBtn"`.
    Expected: Focus returns to the trigger; no stuck modal state remains.
    Evidence: .sisyphus/evidence/task-3-runtime-regressions-error.txt
  ```

  **Commit**: YES | Message: `test(extension): cover modal and standalone lookup regressions` | Files: `tests/e2e/*`, `playwright.config.*`

- [x] 4. Synchronize README, Frontend Docs, and Changelog with the New UX

  **What to do**: Update user-facing and engineering docs so they describe the dedicated `법정동 코드 찾기` page, the modal launched from `건축물대장 조회`, the new nav order, and the current test commands. Ensure stale accordion IDs and inline-flow guidance are removed from active docs. Add one changelog entry for the UX split and stabilization updates.
  **Must NOT do**: Do not rewrite unrelated architecture docs. Do not leave both old and new flow descriptions side by side except in historical changelog sections. Do not claim browser validation exists until Tasks 2 and 3 are green.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: Documentation synchronization with technical accuracy
  - Skills: `[]` - Standard markdown/doc editing is sufficient
  - Omitted: `playwright` - Validation uses grep and command references, not browser automation execution

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 5 | Blocked By: 1

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `README.md:52` - Old user instructions still describe the inline lookup section
  - Pattern: `docs/frontend.md:151` - Building-search docs still reference `finderHeader`, `finderToggle`, and related removed IDs
  - Pattern: `docs/IMPLEMENTATION_COMPLETE.md:248` - Validation section currently only lists `npm test` and syntax checks
  - Pattern: `docs/CHANGELOG.md:5` - Latest release entry exists and should receive a follow-up entry instead of being silently overwritten
  - Pattern: `sidepanel.html:20` - Current nav order and target names
  - Pattern: `sidepanel.html:148` - Current grouped code-input help rail UX
  - Pattern: `sidepanel.html:217` - Dedicated code-finder page exists as a first-class view
  - Pattern: `sidepanel.js:440` - Nav switching is now target-based, not index-based

  **Acceptance Criteria** (agent-executable only):
  - [ ] `README.md` describes the current dedicated page + modal lookup flow and current nav order
  - [ ] `docs/frontend.md` no longer references `finderHeader`, `finderToggle`, `addressSearchInput`, `addressSearchBtn`, `addressSearchResults`, `addressResultsList`, or `resultsCount` as active building-search elements
  - [ ] `docs/IMPLEMENTATION_COMPLETE.md` validation section lists the current unit, syntax, and Playwright commands
  - [ ] `docs/CHANGELOG.md` contains a new entry for the UX split/stabilization work without rewriting historical entries

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```text
  Scenario: Active docs match the current code lookup flow
    Tool: Bash
    Steps: Run `rg -n "주소로 코드 찾기 섹션|finderHeader|finderToggle|addressSearchInput|addressSearchBtn|addressSearchResults|addressResultsList|resultsCount" README.md docs`; run `rg -n "법정동 코드 찾기|openCodeLookupBtn|legalDongCodeView|code-help-rail|playwright" README.md docs`.
    Expected: The first search returns no active-doc matches outside historical changelog context; the second search returns matches in the updated docs.
    Evidence: .sisyphus/evidence/task-4-doc-sync.txt

  Scenario: Changelog keeps history intact
    Tool: Bash
    Steps: Read `docs/CHANGELOG.md` and verify a new top entry exists above `## [1.5.1] - 2026-03-13` rather than modifying old release bullets in place.
    Expected: Historical entries remain intact and a new dated/versioned entry documents the stabilization work.
    Evidence: .sisyphus/evidence/task-4-doc-sync-error.txt
  ```

  **Commit**: YES | Message: `docs(extension): sync code lookup flow and release guidance` | Files: `README.md`, `docs/frontend.md`, `docs/IMPLEMENTATION_COMPLETE.md`, `docs/CHANGELOG.md`

- [x] 5. Add a Release-Readiness Checklist and Packaging Command

  **What to do**: Add a lightweight packaging path and explicit release checklist for this MV3 extension. The checklist must cover version bump, manifest sanity, unpacked-extension smoke test, automated test commands, generated zip artifact, and evidence locations. The packaging command must create a deterministic zip artifact from the repo contents required by the extension runtime.
  **Must NOT do**: Do not introduce CI/CD pipeline sprawl in this cycle. Do not publish to the Chrome Web Store in this task. Do not rely on manual “remember to zip it” steps without a scripted command.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Small build-script plus checklist work
  - Skills: `[]` - Standard Node/Bash packaging is sufficient
  - Omitted: `git-master` - No git history work is required

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 6 | Blocked By: 1, 3, 4

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `package.json:6` - Current scripts are minimal and need a packaging command added
  - Pattern: `manifest.json:5` - Version field must be used by the release checklist and artifact naming
  - Pattern: `manifest.json:31` - Web-accessible resources must be included in the package output
  - Pattern: `README.md:26` - Current install guidance is manual and can reference the new package/checklist flow
  - Pattern: `docs/CHANGELOG.md:5` - Release/version tracking already exists and should stay aligned
  - External: `https://developer.chrome.com/docs/webstore/prepare` - Official extension preparation guidance
  - External: `https://developer.chrome.com/docs/extensions/develop/migrate/publish-mv3` - MV3 publication and release constraints

  **Acceptance Criteria** (agent-executable only):
  - [ ] `package.json` includes `package:extension` that creates `dist/paste-right-v<manifest.version>.zip`
  - [ ] Running `npm run package:extension` produces a zip containing `manifest.json`, `sidepanel.html`, `sidepanel.js`, `background.js`, `storage-utils.js`, `building-code-lookup.js`, `styles/sidepanel.css`, `address-codes.json`, `default-templates.json`, `images/*`, and `libs/Sortable.js`, plus either any existing `icons/*` files or a manifest cleanup that removes stale icon wildcards
  - [ ] A release checklist doc exists and explicitly references `npm test`, syntax checks, Playwright smoke, version bump, and artifact verification
  - [ ] `.sisyphus/evidence/task-5-package-list.txt` contains a file listing from the built zip

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```text
  Scenario: Packaging command creates the expected MV3 artifact
    Tool: Bash
    Steps: Run `npm run package:extension`; inspect the resulting zip contents with an archive-list command; compare against the manifest/runtime-required file list.
    Expected: `dist/paste-right-v<manifest.version>.zip` exists and contains every runtime file required by the extension, and manifest-declared asset paths are either present or cleaned up in the manifest.
    Evidence: .sisyphus/evidence/task-5-package-list.txt

  Scenario: Checklist catches missing version or missing artifact
    Tool: Bash
    Steps: Dry-run the checklist against a branch where the version is not incremented or the zip is absent.
    Expected: The checklist fails with a concrete missing-step or missing-artifact error instead of silently passing.
    Evidence: .sisyphus/evidence/task-5-package-list-error.txt
  ```

  **Commit**: YES | Message: `chore(extension): add packaging checklist and artifact flow` | Files: `package.json`, `docs/RELEASE_CHECKLIST.md`, `dist/*` (generated, not committed unless project policy requires)

- [x] 6. Harden API-Key Handling and Re-Validate Permission Scope

  **What to do**: Implement the near-term hardening default for this cycle: remove the embedded API key from tracked source and move it to a user/config-supplied setting stored via the existing settings infrastructure, with a clear missing-key error state in the sidepanel. Audit `manifest.json` permissions and narrow them only if browser tests prove the existing flows still work; otherwise document why the current scope remains temporarily necessary.
  **Must NOT do**: Do not build a backend proxy in this cycle. Do not silently break building lookup when a key is missing. Do not narrow permissions without rerunning runtime tests and verifying context-menu/content-script behavior.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Security-sensitive config change with runtime implications
  - Skills: `[]` - No specialized external skill required
  - Omitted: `playwright` - Use it for validation, but the main work is config/security design and implementation

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: Final verification | Blocked By: 1, 3, 5

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `sidepanel.js:503` - Hardcoded API key baseline to remove
  - Pattern: `storage-utils.js:1` - Existing settings normalization/storage pattern to extend rather than inventing a new config store
  - Pattern: `sidepanel.html:75` - Existing settings view UI area where a key-management field can live
  - Pattern: `manifest.json:13` - Current permissions list to audit and justify
  - Pattern: `manifest.json:46` - Current content-script host scope to preserve during permission review
  - Pattern: `docs/PROJECT_CONTEXT.md:346` - Existing security issue note for API key exposure
  - Test: `tests/settings-storage.test.js:59` - Existing settings test style and chrome-storage mocking pattern

  **Acceptance Criteria** (agent-executable only):
  - [ ] `sidepanel.js` no longer contains the literal API key or a `const API_KEY = ...` embedding the secret
  - [ ] Settings storage supports a persisted API key field with tests covering default, save, and missing-key behavior
  - [ ] Building-search UI shows a handled configuration error when the key is absent instead of attempting a broken API request
  - [ ] If any permission changes are made, the Playwright suite from Tasks 2 and 3 reruns green and evidence is stored
  - [ ] If permissions are not changed, the release checklist/doc explicitly states why current scope remains and what future tightening depends on

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```text
  Scenario: Secret removal and missing-key UX work correctly
    Tool: Playwright
    Steps: Launch the extension in a fresh Playwright profile with no saved settings state; do not set any `buildingApiKey` or equivalent key in storage; open the side panel; click `#navSearch`; fill `#sigunguInput=41360`, `#bjdongInput=10300`, `#bunInput=0685`, `#jiInput=0017`; click `#searchBtn`; assert `#errorMessage` becomes visible and contains the exact text `API 키를 먼저 설정해주세요`; in parallel run `rg -n "const API_KEY|0432b6814606f51e00ba673c512ed8973ff859a6ed723fa5591b736c76be31fb" sidepanel.js docs` and `node --test tests/settings-storage.test.js`.
    Expected: Secret grep returns no tracked-source matches, settings tests pass, and the browser runtime shows the exact handled missing-key message instead of attempting an opaque failed request.
    Evidence: .sisyphus/evidence/task-6-security-hardening.txt

  Scenario: Permission tightening does not regress runtime behavior
    Tool: Playwright
    Steps: After any manifest-permission edit, rerun the Task 2 and Task 3 browser suite, including sidepanel open, code lookup, and content-script-dependent flows if applicable.
    Expected: All runtime tests remain green; if not, the manifest change is rolled back and the limitation is documented instead.
    Evidence: .sisyphus/evidence/task-6-security-hardening-error.txt
  ```

  **Commit**: YES | Message: `security(extension): remove embedded api key and audit permissions` | Files: `sidepanel.js`, `sidepanel.html`, `storage-utils.js`, `tests/settings-storage.test.js`, `manifest.json`, `docs/*`

## Final Verification Wave (4 parallel agents, ALL must APPROVE)
- [x] F1. Plan Compliance Audit - oracle

  **What to do**: Compare the implemented work against this plan and verify every completed task maps to an in-scope TODO, uses the required commands, and preserves the chosen defaults.
  **Acceptance Criteria**:
  - [ ] No implemented file/change falls outside Tasks 1-6 or the declared defaults
  - [ ] Every required command in `Definition of Done` appears in execution evidence or logs
  - [ ] No optional feature work was pulled in during stabilization

  **QA Scenario**:
  ```text
  Scenario: Plan compliance passes
    Tool: Bash + Read
    Steps: Review the final diff against `.sisyphus/plans/post-ux-split-next-steps.md`; verify each changed file maps to a numbered task; verify evidence/logs include `npm test`, syntax checks, Playwright smoke, docs grep, and secret grep results.
    Expected: No out-of-scope changes are present and every planned gate has execution evidence.
    Evidence: .sisyphus/evidence/f1-plan-compliance.txt
  ```

- [x] F2. Code Quality Review - unspecified-high

  **What to do**: Review the final implementation for maintainability, brittle selectors, duplicated runtime logic, and checklist/doc inconsistencies introduced by the stabilization cycle.
  **Acceptance Criteria**:
  - [ ] No new duplicated code path exists for page vs modal lookup behavior
  - [ ] Browser tests and packaging scripts use stable selectors/paths rather than incidental DOM structure
  - [ ] Docs and checklists do not contradict code or commands

  **QA Scenario**:
  ```text
  Scenario: Code quality review passes
    Tool: Read + Grep
    Steps: Inspect final changes in `sidepanel.js`, `building-code-lookup.js`, test files, and docs; grep for duplicated selectors or stale command strings; compare packaging/checklist docs with actual scripts.
    Expected: No obvious duplication, brittle hardcoding, or doc-command mismatch remains.
    Evidence: .sisyphus/evidence/f2-code-quality.txt
  ```

- [x] F3. Runtime QA Approval - unspecified-high (+ playwright if UI)

  **What to do**: Re-run the final browser/runtime suite plus the packaging command to confirm the stabilization release is green in a real extension runtime.
  **Acceptance Criteria**:
  - [ ] `npx playwright test tests/e2e/sidepanel-code-lookup.spec.js --project=chromium` exits `0`
  - [ ] `npm test` and syntax checks exit `0`
  - [ ] `npm run package:extension` exits `0` and produces the expected artifact

  **QA Scenario**:
  ```text
  Scenario: Final runtime gates pass together
    Tool: Bash + Playwright
    Steps: Run `npm test`; run `node --check sidepanel.js && node --check building-code-lookup.js && node --check storage-utils.js && node --check background.js`; run `npx playwright test tests/e2e/sidepanel-code-lookup.spec.js --project=chromium`; run `npm run package:extension`.
    Expected: All commands exit `0`, Playwright artifacts exist, and the packaged zip is created.
    Evidence: .sisyphus/evidence/f3-runtime-approval.txt
  ```

- [x] F4. Scope Fidelity Check - deep

  **What to do**: Verify the cycle solved the intended stabilization problem and did not drift into unrelated roadmap work or leave the core risks unaddressed.
  **Acceptance Criteria**:
  - [ ] Browser-validation gap is closed
  - [ ] Docs drift is closed
  - [ ] Release/package flow is explicit and reproducible
  - [ ] API-key hardcoding is removed or replaced with the planned near-term model

  **QA Scenario**:
  ```text
  Scenario: Scope fidelity holds
    Tool: Read + Grep
    Steps: Compare final outputs against the four top-level deliverables in this plan; verify no residual docs mention the old inline accordion; verify no tracked source still embeds the API key; verify new work did not include out-of-scope features such as template delete or analytics.
    Expected: The intended stabilization risks are closed and no unrelated roadmap items were implemented.
    Evidence: .sisyphus/evidence/f4-scope-fidelity.txt
  ```

## Commit Strategy
- `test(extension): add sidepanel runtime smoke coverage`
- `test(extension): cover modal and standalone lookup regressions`
- `docs(extension): sync code lookup flow and release guidance`
- `chore(extension): add packaging checklist and artifact flow`
- `security(extension): remove embedded api key and audit permissions`

## Success Criteria
- The current dedicated page + modal UX is proven by automated extension-runtime tests
- No user-facing docs describe the removed inline accordion flow
- Release/package guidance exists and matches the actual repo/runtime
- No embedded public API key remains in tracked source for the chosen near-term release path
