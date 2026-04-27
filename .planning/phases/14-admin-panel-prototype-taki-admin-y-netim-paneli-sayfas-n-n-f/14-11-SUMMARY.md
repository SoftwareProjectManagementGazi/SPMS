---
phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
plan: 11
subsystem: admin-panel-header-buttons
tags:
  [
    admin-panel,
    header-buttons,
    avatar-dropdown,
    cross-phase-verification,
    pdf-download,
    router-push,
    tdd,
    frontend2,
  ]
requires:
  - phase: 14-01
    provides: |
      lib/admin/csv-export.ts downloadCsv() anchor-trigger helper +
      Backend GenerateAdminSummaryPdfUseCase wired at GET /api/v1/admin/summary.pdf
      with @limiter.limit("1/30seconds") server-side rate limit (Phase 12 D-58 reuse).
      Plan 14-11 only consumes — no client-side rate limiter, no new client code.
  - phase: 14-02
    provides: |
      AdminLayout shipped with PageHeader + 2 stub buttons (Rapor al, Denetim günlüğü)
      pre-wired to console.log placeholders. Plan 14-11 swaps the onClick handlers
      and removes the TODO(14-11) markers. Layout structure / a11y / NavTabs strip
      untouched.
  - phase: 14-09
    provides: |
      Backend audit_log enrichment ships extra_metadata in /admin/audit response.
      Plan 14-11 routes Denetim günlüğü to the audit tab; the consuming render path
      (Plan 14-10 audit-event-mapper) lights up the Detay column on arrival.
  - phase: 13
    provides: |
      avatar-dropdown.tsx (Plan 13-02 D-D2) — Admin Paneli menuitem with
      handleNav("/admin") onClick handler; admin-only via case-insensitive role
      check on user.role.name. Plan 14-11 verifies the destination is reachable
      post-Plan-14-02 and locks the contract with a regression test.
provides:
  - Frontend2/app/(shell)/admin/layout.tsx — Rapor al + Denetim günlüğü button
    onClick handlers wired (Plan 14-02 stubs replaced); downloadCsv import added
    from "@/lib/admin/csv-export".
  - Frontend2/components/shell/avatar-dropdown.tsx — VERIFIED unchanged. Phase 13
    D-D2 wiring confirmed correct; no code changes required.
  - Frontend2/app/(shell)/admin/layout.test.tsx — 2 new RTL cases (Cases 5+6)
    asserting the button onClick handlers fire downloadCsv with the canonical URL
    + filename (Case 5) and router.push with /admin/audit (Case 6); existing 4
    baseline cases preserved verbatim.
  - Frontend2/components/shell/avatar-dropdown.test.tsx — 1 new RTL case (Test 14)
    asserting Admin Paneli click → router.push("/admin"); existing 13 cases
    preserved verbatim. Cross-phase contract guard for Phase 13 D-D2 → Phase 14
    Plan 14-02 destination reachability.
affects:
  - Plan 14-12 UAT — manual verification will exercise the Rapor al PDF download
    happy path (click → PDF opens in viewer) + Denetim günlüğü navigation
    (click → /admin/audit Audit table renders). Both flows are listed in the
    Plan 14-12 UAT checklist as user-facing smokes.
tech-stack:
  added: []
  patterns:
    - "Module-mock for downloadCsv at the test boundary — vi.mock('@/lib/admin/csv-export') keeps jsdom from creating a real <a> + .click() (which is a noop without a real browser anyway). The assertion proves the click hands the canonical URL + filename to the export helper. Same pattern is reusable for any future test that needs to verify a CSV/PDF download dispatch without exercising browser-only download primitives."
    - "Button-not-anchor verification for AvatarDropdown menuitems — the existing avatar-dropdown.tsx renders <button onClick={handleNav('/admin')}> for the Admin Paneli item, NOT <Link href>. The PLAN.md draft suggested `expect(link).toHaveAttribute('href', '/admin')`, but that would fail (the element is a button, not an anchor). Test 14 instead asserts pushMock was called with '/admin' — the right contract that survives the existing implementation. Documented in test-file inline comment so future planners don't re-introduce the wrong assertion shape."
    - "Two-commit RED → GREEN gate for one task — even with a single TDD task, kept the test commit (RED) separate from the implementation commit (GREEN) so the gate sequence is verifiable in `git log --oneline`. This matches Plan 14-10's two-phase TDD discipline and makes the test-first intent visible in the commit log without bundling failed-then-passing tests into one squashed commit."
    - "Server-side rate-limit reuse — Plan 14-01 admin-summary endpoint already enforces @limiter.limit('1/30seconds'); Plan 14-11 client just fires the download and lets the backend reject 429 on rapid double-click. Avoids the temptation to mirror the cooldown in client state (which would be a duplicate source of truth + incorrect when the user has multiple admin tabs open)."
key-files:
  created: []
  modified:
    - Frontend2/app/(shell)/admin/layout.tsx
    - Frontend2/app/(shell)/admin/layout.test.tsx
    - Frontend2/components/shell/avatar-dropdown.test.tsx
key-decisions:
  - "avatar-dropdown.tsx left UNCHANGED — Phase 13 D-D2 wiring verified correct. The existing handleNav('/admin') onClick handler IS the right wiring for the Admin Paneli menuitem, the case-insensitive role check IS the right gate, and the destination (/admin layout from Plan 14-02) IS now reachable. Plan 14-11 ships verification only via Test 14 in avatar-dropdown.test.tsx — locking the contract so a future refactor that drops the role check or changes the href fails loudly."
  - "Test 14 asserts pushMock-called-with rather than href getAttribute — the menuitem is a <button>, not a <Link>. The PLAN.md draft suggested `expect(link).toHaveAttribute('href', '/admin')` which would have been a false failure. Test 14 asserts the click invokes router.push('/admin') instead — the right contract that matches the existing implementation."
  - "Module-level vi.mock for csv-export.ts — keeps the test from constructing a real <a> in jsdom (noop in jsdom but messy). The assertion verifies the click hands the canonical URL + filename to the helper, which is the actual contract under test. The downloadCsv internals (anchor creation + body append + click + remove) are already covered by the helper's own contract — no need to re-test them here."
  - "Server-side rate-limit, not client-side — Plan 14-01 admin-summary endpoint enforces 30-second cooldown via @limiter.limit('1/30seconds'). Plan 14-11 client fires the download and lets the server reject 429 on rapid double-clicks. Avoided adding a client-side cooldown / disabled state that would duplicate the source of truth + break when an admin has multiple browser tabs open."
  - "Single Task atomic split into 2 commits (RED + GREEN) — even with a single TDD task in the plan, kept the test commit and the implementation commit separate. Makes the test-first intent visible in `git log --oneline`, mirrors the Plan 14-10 two-phase discipline, and lets a future refactor see exactly which tests were RED-then-GREEN."
patterns-established:
  - "Pattern: Verify-by-test, not verify-by-eyeball — when a plan says 'verify the existing wiring works post-implementation', ship a regression test that locks the contract rather than just running through the UI manually. Test 14 in avatar-dropdown.test.tsx pins the Admin Paneli → /admin contract so any future refactor (e.g., a Phase 15 menu reshuffle) fails loudly instead of silently breaking the cross-phase D-D2 link."
  - "Pattern: Reuse anchor-trigger helper for any same-origin attachment download — Plan 14-01's downloadCsv() works for CSV, PDF, ZIP, anything with Content-Disposition: attachment. The helper's name is misleadingly CSV-specific but its body is content-type-agnostic. Plan 14-11 reuses it for PDF; future plans needing JSON / TXT / XLSX exports should reuse it the same way and treat it as a general 'browser download trigger' rather than a CSV-only primitive. Renaming to a generic name (e.g., triggerDownload) is a v2.1 candidate."
requirements-completed:
  - D-00 (prototype-fidelity quality bar — buttons fire real handlers matching prototype intent, not stubs)
  - D-B6 (Rapor al wired to admin-summary PDF endpoint with server-side 30s rate limit; Denetim günlüğü wired to router.push)
  - D-D2 (Phase 13 cross-phase contract verified — Admin Paneli link reachable post-Plan-14-02 destination ship)
duration: 5min
completed: 2026-04-27
tasks_completed: 1
files_modified: 3
files_created: 0
commits: 2
---

# Phase 14 Plan 14-11: Admin Layout Header Buttons + Avatar Dropdown Verification Summary

**One-liner:** Replaced the Plan 14-02 console.log stubs in admin layout header with real handlers (Rapor al → server-rendered PDF download via Plan 14-01 endpoint; Denetim günlüğü → router.push to /admin/audit) and locked the Phase 13 D-D2 cross-phase contract with a new regression test asserting Admin Paneli routes to /admin.

## Objective Recap

Without this plan, the AdminLayout's two page-header buttons (Rapor al + Denetim günlüğü) ship as visible-but-noop stubs from Plan 14-02 — clicking either logs a `[Plan 14-11 stub]` placeholder to the console and otherwise does nothing. Plan 14-11 closes the loop on D-B6 by wiring the real handlers, and at the same time verifies the Phase 13 D-D2 link from avatar-dropdown.tsx (Admin Paneli menuitem → /admin) actually resolves to the destination Plan 14-02 shipped — locking the cross-phase contract with a regression test instead of relying on manual smoke.

NO new files. NO new endpoints. NO migrations. 3 files modified (1 production + 2 test) — minimal-surface execution.

## What Shipped

### Task 1 — Wire AdminLayout buttons + verify avatar-dropdown link (RED → GREEN)

| Step  | Commit     | Tests              |
| ----- | ---------- | -----------------: |
| RED   | `bc0cc5d3` | 2 failing in layout.test.tsx (Cases 5+6) — Test 14 in avatar-dropdown.test.tsx already green |
| GREEN | `0eb76c41` | 6/6 layout.test.tsx + 14/14 avatar-dropdown.test.tsx — all green |

#### RED phase (`bc0cc5d3` — `test(14-11)`)

Added 3 new test cases ahead of implementation:

- **layout.test.tsx Case 5** — Rapor al click → `downloadCsv("/api/v1/admin/summary.pdf", "admin-summary.pdf")`. Mocks `@/lib/admin/csv-export` to capture the call. Asserts `downloadCsvMock` was called once with the canonical URL + filename, and `pushMock` was NOT called (Rapor al must not navigate).
- **layout.test.tsx Case 6** — Denetim günlüğü click → `router.push("/admin/audit")`. Asserts `pushMock` was called once with the audit path, and `downloadCsvMock` was NOT called (audit nav must not download).
- **avatar-dropdown.test.tsx Test 14** — Admin Paneli click for an admin user → `router.push("/admin")`. Already passes (Phase 13 wiring is correct); kept as a regression guard locking the D-D2 contract.

RED status confirmed by running `npm run test -- --run "app/(shell)/admin/layout.test.tsx"`: Cases 5+6 fail with `expected "spy" to be called 1 times, but got 0 times` while the stubs still log `[Plan 14-11 stub]`. Test 14 in avatar-dropdown.test.tsx already passes (verifies, not RED — by design per the plan's "no code changes expected" instruction for avatar-dropdown).

#### GREEN phase (`0eb76c41` — `feat(14-11)`)

Replaced the 2 stub onClick handlers in `Frontend2/app/(shell)/admin/layout.tsx`:

```tsx
// Before (Plan 14-02 stub):
onClick={() => {
  console.log("[Plan 14-11 stub] Rapor al — to be wired")
}}

// After (Plan 14-11 GREEN):
onClick={() => downloadCsv("/api/v1/admin/summary.pdf", "admin-summary.pdf")}
```

```tsx
// Before:
onClick={() => {
  console.log("[Plan 14-11 stub] Denetim günlüğü — to be wired")
}}

// After:
onClick={() => router.push("/admin/audit")}
```

Added the import:

```tsx
import { downloadCsv } from "@/lib/admin/csv-export"
```

Removed both `TODO(14-11):` marker comments. Updated the file's header comment to reflect Plan 14-11 wiring (replaces the previous "Plan 14-11 wires them" forward-reference with a description of the actual implementation).

avatar-dropdown.tsx required NO code change — the existing `handleNav("/admin")` onClick on the Admin Paneli menuitem and the case-insensitive role check (`isAdmin = roleName.toLowerCase() === "admin"`) are both correct. Test 14 confirms.

GREEN status confirmed by:

- `cd Frontend2 && npm run test -- --run "app/(shell)/admin/layout.test.tsx"` → 6/6 pass (Cases 1-4 baseline + Cases 5+6 button wiring)
- `cd Frontend2 && npm run test -- --run avatar-dropdown.test.tsx` → 14/14 pass (no regression on Phase 13)
- `cd Frontend2 && npm run build` → exits 0 (production build clean; all 8 admin sub-routes prerendered)

## Audit Wiring Coverage Matrix

| Surface                                | What Wired                                                              | Test Locking It                                       |
| -------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| AdminLayout / Rapor al button          | onClick → `downloadCsv("/api/v1/admin/summary.pdf", "admin-summary.pdf")` | layout.test.tsx Case 5                                |
| AdminLayout / Denetim günlüğü button   | onClick → `router.push("/admin/audit")`                                 | layout.test.tsx Case 6                                |
| AvatarDropdown / Admin Paneli menuitem | onClick → `router.push("/admin")` (Phase 13 wiring — VERIFIED)          | avatar-dropdown.test.tsx Test 14 (NEW regression guard) |

## Test Commands That Proved Each Must-Have Truth

| Truth                                                                              | Test Command                                                                                  | Result    |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------- |
| Layout `alert("Plan 14-11 will wire this")` count = 0                              | `grep -c 'alert(.*Plan 14-11 will wire this' Frontend2/app/(shell)/admin/layout.tsx` → 0      | ✅        |
| Layout Rapor al wired to downloadCsv with canonical URL + filename                 | `grep -c 'downloadCsv("/api/v1/admin/summary.pdf", "admin-summary.pdf")' layout.tsx` → 1      | ✅        |
| Layout Denetim günlüğü wired to router.push("/admin/audit") (callsite)             | layout.test.tsx Case 6 fires fireEvent.click + asserts pushMock called with "/admin/audit"    | ✅ 6/6    |
| Layout imports downloadCsv from "@/lib/admin/csv-export"                           | `grep -c 'downloadCsv \} from "@/lib/admin/csv-export"' layout.tsx` → 1                       | ✅        |
| TODO(14-11) comments removed                                                       | `grep -c 'TODO(14-11)' Frontend2/app/(shell)/admin/layout.tsx` → 0                            | ✅        |
| Plan 14-11 stub log lines removed                                                  | `grep -c 'Plan 14-11 stub' Frontend2/app/(shell)/admin/layout.tsx` → 0                        | ✅        |
| avatar-dropdown.tsx Admin Paneli onClick uses handleNav("/admin")                  | `grep -c 'handleNav("/admin")' Frontend2/components/shell/avatar-dropdown.tsx` → 1            | ✅        |
| avatar-dropdown.test.tsx Test 14 asserts admin click → router.push("/admin")       | avatar-dropdown.test.tsx Test 14 fires user.click + asserts pushMock called with "/admin"     | ✅ 14/14  |
| `cd Frontend2 && npm run test -- --run "app/(shell)/admin/layout.test.tsx"`         | exits 0; 6/6 cases (1 isLoading + 2 redirect + 3 admin render + 5 Rapor al + 6 audit nav)     | ✅        |
| `cd Frontend2 && npm run test -- --run avatar-dropdown.test.tsx`                   | exits 0; 14/14 cases (13 baseline + 1 new D-D2 regression guard)                              | ✅        |
| `cd Frontend2 && npm run build`                                                    | exits 0; 23 routes prerendered including all 8 /admin/* sub-routes + middleware proxy         | ✅        |

## Wave 3 Deliverables for 14-VALIDATION.md

| 14-VALIDATION row                                                          | Status                                  |
| -------------------------------------------------------------------------- | --------------------------------------- |
| 14-11-T1 (AdminLayout button wiring + avatar-dropdown Admin Paneli verify) | ✅ green (`bc0cc5d3` RED + `0eb76c41` GREEN) |

## Files Modified

**Modified (3):**

- `Frontend2/app/(shell)/admin/layout.tsx` — 2 onClick handlers replaced (console.log stubs → downloadCsv + router.push); downloadCsv import added; header comment updated; both TODO(14-11) markers removed. +25 / -18 lines net.
- `Frontend2/app/(shell)/admin/layout.test.tsx` — 2 new RTL cases (5+6) for D-B6 button wiring; pushMock + downloadCsvMock added to mock harness; csv-export module mocked at module scope. +85 / -2 lines net.
- `Frontend2/components/shell/avatar-dropdown.test.tsx` — 1 new RTL case (Test 14) for D-D2 cross-phase verification; existing 13 cases preserved. Header docstring extended to include Test 14 description. +24 / -1 lines net.

**NOT modified:**

- `Frontend2/components/shell/avatar-dropdown.tsx` — verified correct, no code change required (Phase 13 D-D2 wiring intact and correct).

## Decisions Made

See `key-decisions` in frontmatter — 5 entries spanning the avatar-dropdown verify-only treatment, the button-not-anchor test assertion shape (Test 14 asserts pushMock-called-with rather than getAttribute("href")), the module-level csv-export mock, the server-side rate-limit reuse rationale, and the RED/GREEN two-commit discipline despite a single-task plan.

## Deviations from Plan

### Auto-fixed Issues

**None — Plan 14-11 executed exactly as written.**

The plan's wording in the avatar-dropdown.test.tsx test draft suggested `expect(link).toHaveAttribute('href', '/admin')`, but the implementation has used `<button onClick={handleNav('/admin')}>` since Phase 13 — not a `<Link href>`. I adjusted Test 14 to assert `pushMock.toHaveBeenCalledWith('/admin')` instead, which is the correct contract for the actual implementation. This is documented as a key-decision rather than a deviation because the plan itself acknowledged this option ("If wrapped in <Link>, assert href" — implying the alternative was anticipated when not wrapped).

### Path / Scope Adjustments

- **Test count:** Plan PLAN.md draft suggested 2 new test cases for avatar-dropdown.test.tsx (admin shows + non-admin hides). The existing test file already covers visibility/non-visibility in Tests 3+4+5 (plus Test 5 specifically for case-insensitive role string). Adding a duplicate "non-admin hidden" test would be redundant. Test 14 is the ONLY new addition — the strengthened "admin click → push /admin" contract that the existing tests don't cover. Net: 1 new avatar-dropdown test instead of 2, with no loss of coverage.

### Out-of-Scope Discoveries

None. All 3 file modifications stayed inside the plan's `<files>` declaration.

---

**Total deviations:** 0 auto-fixed + 1 path adjustment (test count: 1 instead of 2 for avatar-dropdown, with rationale).
**Impact on plan:** No deviations changed scope or behavior. Test draft adjusted to match the existing implementation shape (button-not-anchor); duplicate-coverage test omitted.

## Issues Encountered

None — Plan 14-02 had already shipped the stub buttons with clean TODO(14-11) markers, the csv-export.ts helper from Plan 14-01 was a drop-in fit for the PDF download (anchor-trigger pattern works for any same-origin attachment, not just CSV), and Phase 13 avatar-dropdown wiring was verified-correct on first inspection. Plan 14-11 is the smallest plan in Phase 14 — single task, 5 minutes of execution, 2 commits.

## User Setup Required

None — no external service configuration. The Plan 14-01 admin-summary endpoint is already wired and rate-limited server-side; the Plan 14-07 audit tab is already routable. Plan 14-11 only flips the front-end onClicks.

## Threat Mitigation Recap (STRIDE Register)

| Threat ID  | Mitigation Applied                                                                                                                                                                                                                                                                                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-14-11-01 | (D — Denial of Service via PDF endpoint flooding) Server-side `@limiter.limit("1/30seconds")` on /admin/summary.pdf (Plan 14-01 reuse of Phase 12 D-58). Client just downloads — no client-side cooldown needed. Verified by Plan 14-01 backend integration test `test_generate_admin_summary_pdf.py`.                                                          |
| T-14-11-02 | (E — Elevation of Privilege via admin link visible to non-admin) avatar-dropdown.tsx Phase 13 D-D2 conditionally renders the Admin Paneli menuitem only when `isAdmin = roleName.toLowerCase() === "admin"`. Test 4 in avatar-dropdown.test.tsx asserts non-admin (Member role) does NOT see the link; verified pre-existing and re-confirmed by Plan 14-11.    |
| T-14-11-03 | (I — Information Disclosure via direct URL bypassing auth) Backend /admin/summary.pdf endpoint uses `Depends(require_admin)`. Anchor-triggered download fires an HTTP request with auth cookies/JWT; anonymous user receives 401/403. Verified by Plan 14-01 backend integration test asserting non-admin role returns 403.                                     |

## Hand-off to Plan 14-12

Plan 14-11 closes Wave 3 (cross-cutting integration). Plan 14-12 is the final wave — Playwright e2e specs + UAT checklist + VALIDATION.md table population. The Plan 14-12 e2e specs should include:

- **admin-route-guard.spec.ts** — anonymous user → /admin → redirect to /auth/login?next=/admin (Plan 14-02 middleware + AdminLayout client guard); non-admin user → /admin → redirect to /dashboard with toast.
- **admin-overview.spec.ts** — admin user → click avatar → click Admin Paneli (Plan 14-11 cross-phase) → /admin loads with 5 StatCards + Pending Requests + Recent admin events. Click Rapor al → PDF download intercepted (e2e file-download asserter). Click Denetim günlüğü → /admin/audit page renders.
- **admin-users.spec.ts** — admin types in search → user table filters; click MoreH → Deactivate → toast + row badge updates.
- **admin-audit.spec.ts** — URL `/admin/audit?action=task.update&actor_id=1` → table prefilled; Filtre button → modal opens.
- **admin-stats.spec.ts** — /admin/stats → 3 charts render (recharts LineChart + pure CSS Methodology bars + Velocity grid).

The Plan 14-11 wired buttons should appear in the `admin-overview.spec.ts` happy-path assertion: `await expect(page.locator("button", { hasText: "Rapor al" })).toBeVisible()` and `await expect(page.locator("button", { hasText: "Denetim günlüğü" })).toBeVisible()`. Skip-guarded per Phase 11 D-50 e2e pattern (defensive guards when auth/seed unavailable).

## Self-Check: PASSED

- [x] Both task commits exist in git log (`bc0cc5d3` test, `0eb76c41` feat)
- [x] Frontend2/app/(shell)/admin/layout.tsx contains `downloadCsv("/api/v1/admin/summary.pdf", "admin-summary.pdf")` exactly once at the Rapor al onClick
- [x] Frontend2/app/(shell)/admin/layout.tsx contains `router.push("/admin/audit")` at the Denetim günlüğü onClick (1 callsite + 1 doc-comment line = 2 grep matches; the callsite is the contract)
- [x] Frontend2/app/(shell)/admin/layout.tsx imports downloadCsv from "@/lib/admin/csv-export" (1 grep match)
- [x] Frontend2/app/(shell)/admin/layout.tsx contains 0 occurrences of `alert("Plan 14-11 will wire this")` (stubs removed)
- [x] Frontend2/app/(shell)/admin/layout.tsx contains 0 occurrences of `TODO(14-11)` (markers removed)
- [x] Frontend2/app/(shell)/admin/layout.tsx contains 0 occurrences of `Plan 14-11 stub` (log lines removed)
- [x] Frontend2/components/shell/avatar-dropdown.tsx contains `handleNav("/admin")` (Phase 13 wiring intact, 1 grep match)
- [x] Frontend2/components/shell/avatar-dropdown.test.tsx contains a new test asserting admin user click → pushMock called with "/admin"
- [x] `cd Frontend2 && npm run test -- --run "app/(shell)/admin/layout.test.tsx"` exits 0 (6/6 — 4 baseline + 2 new D-B6 cases)
- [x] `cd Frontend2 && npm run test -- --run avatar-dropdown.test.tsx` exits 0 (14/14 — 13 baseline + 1 new D-D2 verification)
- [x] `cd Frontend2 && npm run build` exits 0 (production build clean; 23 routes prerendered including all 8 /admin/* sub-routes)
- [x] No new files created (3 modified, 0 created — minimal-surface execution)
- [x] No regression on existing tests; Plan 14-11 commits committed atomically (RED + GREEN separate)

## TDD Gate Compliance

Plan 14-11's single task was marked `tdd="true"`. Gate sequence verified in `git log --oneline | head -3`:

```
0eb76c41 feat(14-11): GREEN — wire AdminLayout Rapor al + Denetim günlüğü buttons (D-B6)
bc0cc5d3 test(14-11): RED — failing tests for AdminLayout button wiring + Admin Paneli reachability
3e1daa69 docs(14-10): complete frontend audit-event-mapper extension + activity-row plan
```

- ✅ RED test commit (`bc0cc5d3`) precedes GREEN feat commit (`0eb76c41`).
- ✅ RED commit added 3 tests; 2 failed pre-implementation (layout Cases 5+6) and 1 passed (avatar-dropdown Test 14 — verifies existing correctness).
- ✅ GREEN commit flipped Cases 5+6 to passing; no new tests added in GREEN.
- ✅ No REFACTOR commit needed — implementation is already minimal (2 onClick handler swaps + 1 import).

## Threat Flags

None — Plan 14-11 introduces no new network surface beyond what Plan 14-01 already shipped (the existing /admin/summary.pdf endpoint). The new client-side router.push to /admin/audit reuses the existing Plan 14-07 audit page; no new auth path, no new data exposure, no new schema mutation.

---

_Phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f_
_Completed: 2026-04-27_
