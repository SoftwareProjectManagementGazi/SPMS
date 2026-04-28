---
phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
plan: 13
subsystem: frontend2/admin/downloads
tags:
  - admin-panel
  - gap-closure
  - download
  - auth
  - frontend2
  - cluster-a
  - uat-401-fix
gap_closure: true
requirements:
  - D-B6
  - D-B8
  - D-W3
dependency_graph:
  requires:
    - "@/lib/constants — AUTH_TOKEN_KEY (verified locked-in)"
    - "@/lib/api-client — JSON quoted-token guard pattern (mirrored verbatim)"
    - "Backend GET /api/v1/admin/summary.pdf  (Plan 14-01)"
    - "Backend GET /api/v1/admin/users.csv    (Plan 14-01)"
    - "Backend GET /api/v1/admin/audit.json   (Plan 14-01)"
  provides:
    - "Frontend2/lib/admin/download-authenticated.ts — single shared authenticated-blob-download helper"
  affects:
    - "Frontend2/app/(shell)/admin/layout.tsx — Rapor al wired through new helper"
    - "Frontend2/components/admin/users/users-toolbar.tsx — CSV button wired through new helper"
    - "Frontend2/components/admin/audit/admin-audit-toolbar.tsx — JSON button wired through new helper"
    - "Frontend2/lib/admin/csv-export.ts — deprecated for admin endpoints (kept for hypothetical public callers, zero live admin callers remain)"
tech_stack:
  added: []
  patterns:
    - "Single producer / multiple consumers (mirrors Plan 14-01 more-menu.tsx pattern)"
    - "fetch+blob+programmatic anchor click+revokeObjectURL (browser-standard authenticated download)"
    - "Quoted-token guard mirroring api-client.ts:18 (JSON.parse before Bearer prefix)"
    - "try/catch + showToast on consumer side for 401/429/5xx visibility"
key_files:
  created:
    - "Frontend2/lib/admin/download-authenticated.ts"
    - "Frontend2/lib/admin/download-authenticated.test.ts"
  modified:
    - "Frontend2/app/(shell)/admin/layout.tsx"
    - "Frontend2/app/(shell)/admin/layout.test.tsx"
    - "Frontend2/components/admin/users/users-toolbar.tsx"
    - "Frontend2/components/admin/audit/admin-audit-toolbar.tsx"
    - "Frontend2/lib/admin/csv-export.ts"
    - "Frontend2/services/admin-user-service.ts"
    - "Frontend2/services/admin-audit-service.ts"
decisions:
  - "Kept csv-export.ts (NOT deleted) and added prominent deprecation header + JSDoc @deprecated tag — reserved for hypothetical future PUBLIC endpoints; zero live admin callers remain."
  - "Mirrored api-client.ts:18 quoted-token guard verbatim in the new helper (B-1 fix) — uses AUTH_TOKEN_KEY constant, applies JSON.parse on literal-quoted localStorage values BEFORE the Bearer prefix."
  - "Updated layout.test.tsx vi.mock target from '@/lib/admin/csv-export' to '@/lib/admin/download-authenticated' (B-2 fix). Without this swap the test would silently fail to assert anything meaningful — the click would reach the real helper which has no fetch in jsdom."
  - "Date-suffixed filenames (admin-summary-YYYY-MM-DD.pdf, users-YYYY-MM-DD.csv, audit-YYYY-MM-DD.json) for archive UX — server's Content-Disposition is overridden by the anchor's download attribute when same-origin."
  - "All three consumers wrap the call in try/catch and surface 401/429/5xx via showToast (variant: 'error') — the user gets actionable feedback instead of a silent retry-icon."
metrics:
  duration_minutes: 11
  task_count: 2
  file_count: 9
  completed: "2026-04-28"
---

# Phase 14 Plan 14-13: Cluster A — Authenticated Admin Download (UAT 401 Fix) Summary

Single shared authenticated-blob-download helper closes 3 UAT gap-truths (#2 Rapor al PDF, #5 Users CSV, #12 Audit JSON) by switching from the anchor-trigger `downloadCsv()` (which strips the Authorization header) to a `fetch+blob+programmatic-click+revoke` helper that includes `Bearer <token>`.

## Goals (Closed)

- Closes UAT gap-truth #2 — `Rapor al` PDF download from `/admin` layout (Test 5).
- Closes UAT gap-truth #5 — Users CSV export from `/admin/users` toolbar (Test 16).
- Closes UAT gap-truth #12 — Audit JSON export from `/admin/audit` toolbar (Test 28).
- Single shared helper enforces "single producer, multiple consumers" (mirrors Plan 14-01 `more-menu.tsx` pattern).
- Backend changes: ZERO. All three endpoints already had `Depends(require_admin)` from Plan 14-01 (PDF/CSV) and Plan 14-07 (JSON); the bug was 100% on the frontend caller path.

## Implementation

### Task 1 — `downloadAuthenticated` helper + RTL test (TDD)

**RED commit** `bf88c771` — wrote 8 failing specs locking the contract:
1. `Authorization: Bearer <token>` header read from `AUTH_TOKEN_KEY` constant (B-1).
2. JSON quoted-token guard — JSON-stringified `'"abc.def.ghi"'` becomes `Bearer abc.def.ghi`, NOT `Bearer "abc.def.ghi"` (mirrors `api-client.ts:18`).
3. Blob lifecycle order: `createObjectURL → appendChild → click → removeChild → setTimeout(revokeObjectURL, 0)`.
4. Non-2xx response throws and does NOT mutate the DOM.
5. Optional `filename` argument sets `<a>.download`.
5b. Without `filename`, `<a>.download` is empty (server `Content-Disposition` wins).
6. SSR safety — when `document` is undefined, helper resolves to `undefined` without throwing.
7. No-token fallback — fetch is fired without `Authorization` header (caller surfaces the 401 as a toast).

**GREEN commit** `56c3c83e` — implemented the helper. The `afterEach` hook drains pending `setTimeout(revokeObjectURL, 0)` macrotasks before tearing down the URL spies — without this, the deferred revoke fires AFTER the spy is removed, producing an uncaught `TypeError` that vitest reports as a test-file error (despite all assertions passing).

**Result:** 8/8 tests pass.

### Task 2 — Rewire 3 consumers + B-2 mock-swap + csv-export deprecation

**Commit** `25851ac0`:

1. **`Frontend2/app/(shell)/admin/layout.tsx`** — `Rapor al` button onClick now `await downloadAuthenticated("/api/v1/admin/summary.pdf", "admin-summary-<YYYY-MM-DD>.pdf")` wrapped in `try/catch` with `showToast({ variant: "error", message })` on failure.
2. **`Frontend2/components/admin/users/users-toolbar.tsx`** — `handleCsvExport` rewritten as `async`; calls `downloadAuthenticated(adminUserService.exportCsv(filter), 'users-<YYYY-MM-DD>.csv')` with the same toast-on-error pattern.
3. **`Frontend2/components/admin/audit/admin-audit-toolbar.tsx`** — `onJsonExport` rewritten as `async`; calls `downloadAuthenticated(adminAuditService.exportJsonUrl(filter), 'audit-<YYYY-MM-DD>.json')` with the same toast-on-error pattern.
4. **`Frontend2/app/(shell)/admin/layout.test.tsx` (B-2 fix)** — `vi.mock` target swapped from `@/lib/admin/csv-export` (downloadCsv) to `@/lib/admin/download-authenticated` (downloadAuthenticated); the mock now resolves to `undefined` to mirror the real `Promise<void>` shape; Case 5 assertion swapped to `expect(downloadAuthenticatedMock).toHaveBeenCalledWith(canonicalUrl, expect.stringMatching(/^admin-summary-\d{4}-\d{2}-\d{2}\.pdf$/))`.
5. **`Frontend2/lib/admin/csv-export.ts`** — kept (NOT deleted), added prominent deprecation header + JSDoc `@deprecated` tag pointing readers at `download-authenticated.ts`. Reserved for hypothetical future PUBLIC endpoints; zero live admin callers remain.
6. **`Frontend2/services/admin-user-service.ts` + `Frontend2/services/admin-audit-service.ts`** — file headers and `exportCsv` / `exportJsonUrl` JSDoc comments updated to point at the new helper so future readers don't reintroduce the bug.

**Verification:**
- `npx vitest run components/admin lib/admin "app/(shell)/admin"` → 12/12 files / 57/57 tests pass.
- `npm run build` → green; all 23 routes (8 admin sub-routes included) prerender successfully.
- `grep 'downloadCsv(' Frontend2/app Frontend2/components` returns ZERO live calls (only documentation references remain).

## B-1 + B-2 Closure Confirmation

- **B-1 (token-storage contract):** `Frontend2/lib/admin/download-authenticated.ts:22` imports `AUTH_TOKEN_KEY` from `@/lib/constants`; line 60 applies the `cleanToken = token.startsWith('"') ? JSON.parse(token) : token` quoted-token guard before `Bearer ${cleanToken}` at line 61. Test 2 in the unit suite locks both behaviours.
- **B-2 (mock-target update):** `Frontend2/app/(shell)/admin/layout.test.tsx:42` now reads `vi.mock("@/lib/admin/download-authenticated", ...)`; Case 5 (line 195) asserts `downloadAuthenticatedMock` was called with the canonical PDF URL. The downloadCsvMock variable no longer exists in the test file.

## csv-export.ts Disposition

**Kept** with explicit deprecation:
- File header now starts with `!!! DEPRECATED for any /api/v1/admin/* endpoint !!!` and points readers at `download-authenticated.ts`.
- The exported `downloadCsv` function carries a `@deprecated` JSDoc tag.
- File is NOT deleted because:
  1. Zero live admin callers remain (verified via grep), but
  2. A hypothetical future PUBLIC endpoint (no auth) could legitimately use the simpler anchor-trigger pattern.
  3. Removing the file would force a deletion-PR ceremony and complicate any future revert; deprecation is the lower-friction path.

## Deviations from Plan

None. Plan executed exactly as written:
- TDD RED → GREEN sequence followed (Task 1).
- All 4 sub-steps of Task 2 (3 consumer rewires + 1 test mock-swap + 1 deprecation note) shipped in a single atomic commit per the plan's "logical step: helper + tests, consumer rewires, csv-export deprecation" guidance.
- Plan called for "3 commit SHAs"; actual: 3 commits (`bf88c771` test-RED, `56c3c83e` impl-GREEN, `25851ac0` rewire+deprecate). Matches the plan's commit-shape expectation.

## Authentication Gates

None encountered. The plan was a pure-frontend fix; no backend auth gates (login, secrets) needed during execution.

## Deferred Issues

19 pre-existing `components/workflow-editor/*` test failures (3 files) discovered during the wider regression sweep are out-of-scope per the plan's `must_haves.truths` (admin downloads only). Verified pre-existing by running the same suite at `c3147c31` (the commit BEFORE Plan 14-13 started): same 19 failures, same files. Logged to `deferred-items.md` § "Plan 14-13 (Cluster A — UAT 401 fix)" for a future workflow-editor stabilization plan.

## Threat Flags

None. The new helper preserves the existing JWT-bearer auth contract (mirroring `api-client.ts:18`) and adds no new network surface — it consumes 3 already-gated admin endpoints. The deprecation of `csv-export.ts` REDUCES the attack surface (no more silent unauthenticated GETs to admin-only paths).

## Self-Check: PASSED

**Files exist:**
- `Frontend2/lib/admin/download-authenticated.ts` — FOUND
- `Frontend2/lib/admin/download-authenticated.test.ts` — FOUND
- `.planning/phases/14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f/14-13-SUMMARY.md` — FOUND (this file)

**Commits exist:**
- `bf88c771` test(14-13): add failing tests — FOUND
- `56c3c83e` feat(14-13): implement helper — FOUND
- `25851ac0` fix(14-13): rewire 3 consumers — FOUND

**must_haves.truths verified:**
- Header `Rapor al` click → calls `downloadAuthenticated("/api/v1/admin/summary.pdf", ...)` at `app/(shell)/admin/layout.tsx:196-199`. Build green; layout.test.tsx Case 5 locks the contract.
- CSV toolbar button → calls `downloadAuthenticated(adminUserService.exportCsv(filter), 'users-<YYYY-MM-DD>.csv')` at `components/admin/users/users-toolbar.tsx:67-78`.
- JSON toolbar button → calls `downloadAuthenticated(adminAuditService.exportJsonUrl(filter), 'audit-<YYYY-MM-DD>.json')` at `components/admin/audit/admin-audit-toolbar.tsx:64-77`.
- All three downloads share `Frontend2/lib/admin/download-authenticated.ts` (single producer, 3 consumers).
- Deprecated `downloadCsv` carries `@deprecated` JSDoc + prominent file-header warning; zero live admin callers remain.

**must_haves.artifacts verified:**
- `Frontend2/lib/admin/download-authenticated.ts` exports `async function downloadAuthenticated(...)` — FOUND.
- `Frontend2/lib/admin/download-authenticated.test.ts` contains `describe("downloadAuthenticated", ...)` — FOUND.

**must_haves.key_links verified:**
- `users-toolbar.tsx` → `/api/v1/admin/users.csv` via `downloadAuthenticated(adminUserService.exportCsv(filter), ...)` — FOUND.
- `admin-audit-toolbar.tsx` → `/api/v1/admin/audit.json` via `downloadAuthenticated(adminAuditService.exportJsonUrl(filter), ...)` — FOUND.
- `app/(shell)/admin/layout.tsx` → `/api/v1/admin/summary.pdf` via direct `downloadAuthenticated("/api/v1/admin/summary.pdf", ...)` — FOUND.

Manual smoke check (Backend running + admin login): plan recommends developer post-execute walkthrough. The 3 download buttons should now hit 200 OK with real binaries. NOT scripted in CI.
