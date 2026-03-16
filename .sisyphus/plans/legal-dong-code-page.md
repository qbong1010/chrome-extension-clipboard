# Legal Dong Code Finder UX split plan

## Goal

Preserve the current address-based code lookup behavior, but separate it from the main building search screen.

## Intended UX

1. Add a new side-rail page named `법정동 코드 찾기`.
2. Keep the current address-search-based code lookup UI and behavior on that page.
3. Make `건축물대장 조회` focus on direct building lookup inputs.
4. Add a compact question-mark button to the right side of the `시군구코드` field area.
5. Open a native `<dialog>` modal from that button.
6. Reuse the same address-search-based code lookup UI inside the modal.
7. When a result is selected from the page or modal, fill `시군구코드` and `법정동코드`, show the existing toast, move focus to `본번`, and close the modal if it is open.

## Files To Edit

- `sidepanel.html`
- `sidepanel.js`
- `styles/sidepanel.css`

## Planned Changes

### 1. Navigation and page structure

- Add one new nav item to the navigation rail.
- Add one new `content-area` view for `법정동 코드 찾기`.
- Keep the project's current `display: block/none` page switching model.
- Replace index-only nav switching with explicit target-based view switching to avoid brittle behavior after the new page is added.

### 2. Building search page simplification

- Remove the inline address-finder accordion from `건축물대장 조회`.
- Keep the current direct code inputs and building lookup behavior unchanged.
- Add a small question-mark trigger button adjacent to the `시군구코드` input area.
- Add helper text so the split is understandable without reading documentation.

### 3. Shared address finder UI

- Extract the address finder markup into reusable HTML blocks for:
  - the standalone page
  - the dialog modal
- Refactor address finder behavior into reusable JS helpers that accept a DOM root or a grouped element map.
- Keep `loadAddressData()` and `searchAddressByKeyword()` as shared logic.
- Ensure search results rendering is scoped to the active finder instance and does not rely on global IDs.

### 4. Selection behavior

- On result selection, write values into the main building inputs:
  - `sigunguInput`
  - `bjdongInput`
- Keep existing toast feedback.
- Focus `bunInput` after selection.
- If selection happened from the modal, close the modal.
- If selection happened from the page, keep the user on the page.

### 5. Styling

- Reuse the current MD3-inspired visual language.
- Add styles for:
  - the new nav item state
  - the compact help button near the field
  - the new standalone page surface
  - the code finder modal sizing and internal scrolling
- Avoid broader redesign outside this requested split.

## Risks and Mitigations

### Risk: duplicated IDs break event wiring

Mitigation:
- Do not reuse the current hardcoded finder IDs in multiple places.
- Use instance-scoped selectors under each finder root.

### Risk: modal selection does not update the main form reliably

Mitigation:
- Keep the building form inputs as the single source of truth.
- Route all selection events through one shared apply-selection helper.

### Risk: nav switching becomes brittle after adding a fourth item

Mitigation:
- Use data attributes or an explicit nav-to-view mapping instead of index-only conditions.

## Verification Plan

1. Open the side panel and verify the new `법정동 코드 찾기` nav item appears.
2. Verify the standalone page shows the same address lookup flow as before.
3. Verify `건축물대장 조회` no longer shows the inline finder section.
4. Verify the question-mark button opens a modal.
5. Verify searching from the modal returns results and selecting one fills the main building inputs.
6. Verify searching from the standalone page also fills the main building inputs.
7. Verify `bunInput` receives focus after selection.
8. Verify existing building lookup still works with manual input and example input.
9. Run diagnostics and available automated tests.

## Atomic Commit Strategy

If a commit is requested later, use one commit covering the UX split only:

- `split address code lookup into dedicated page and modal`
