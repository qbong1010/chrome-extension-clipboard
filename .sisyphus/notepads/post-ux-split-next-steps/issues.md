2026-03-16 Task 1
- `README.md:54` still describes the old inline `주소로 코드 찾기` section.
- `docs/frontend.md:161-164` still documents removed accordion selectors.
- `sidepanel.js:503-504` still embeds the API key.
- `manifest.json:22-24` still grants `<all_urls>` host permissions.

2026-03-16 Task 2
- Initial Playwright smoke run failed because `bunInput` lost focus after modal selection; fixed by moving focus restoration to the dialog close path for `returnValue === "select"`.

2026-03-16 Task 3
- No new blockers found. The runtime regression suite is green after adding mock-backed building-search coverage.

2026-03-16 Task 4
- Grep include filtering was unreliable in this environment, so doc-sync verification used direct file reads plus file-specific grep checks.

2026-03-16 Task 5
- No packaging blocker remains. The only asset anomaly was the missing `icons/` directory, which is handled by sanitizing the packaged manifest.

2026-03-16 Task 6
- Permissions were intentionally left unchanged; this remains a documented future audit item rather than an unresolved blocker for the current stabilization cycle.
