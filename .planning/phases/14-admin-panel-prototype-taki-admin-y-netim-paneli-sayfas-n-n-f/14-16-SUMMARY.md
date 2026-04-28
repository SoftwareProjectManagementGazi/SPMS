---
phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f
plan: 16
subsystem: ui
tags: [admin-panel, audit-log, gap-closure, user-decision-locked, react, fastapi, sqlalchemy, vitest, pytest]

# Dependency graph
requires:
  - phase: 14
    provides: Plan 14-09 audit_log extra_metadata enrichment (task_title / project_name / milestone_title / artifact_name / comment_excerpt) — Plan 14-16 entity_label resolver reads these
  - phase: 14
    provides: Plan 14-10 audit-event-mapper + activity-row variant=admin-table (D-D5) — Plan 14-16 wires hideTimestamp into the existing variant render path
  - phase: 14
    provides: Plan 14-07 admin-audit-table.tsx + admin-audit-row.tsx skeleton — Plan 14-16 reduces 6-track grid → 5-track + adds role-based ARIA
  - phase: 9
    provides: audit_log.extra_metadata JSONB column (D-08 migration 005) — entity_label resolver reads this column
provides:
  - 5-column AuditTable contract permanently locked (Path B per user_decision_locked 2026-04-28)
  - audit_repo._resolve_entity_label cross-table helper (project_name / task_title / milestone_title / artifact_name / "yorum:" prefix / f"{ENTITY}-{id}" legacy fallback)
  - hideTimestamp?: boolean prop on ActivityRow with explicit default = false (preserves Recent Events)
  - role="row" / role="columnheader" / role="cell" semantics on AdminAuditTable for positional RTL assertions
  - UAT row 26 closed (pending re-verify) with 5-column contract + fix_summary documentation
affects: [14-17, 15, future-v2.1-IP-column]

# Tech tracking
tech-stack:
  added: []  # no new libraries — pure refactor of existing primitives
  patterns:
    - "User-decision-locked frontmatter — when an executor receives a user_decision_locked block, ignore historical Path A escape hatches and ship the locked Path B contract verbatim. Do NOT re-derive the decision tree at execution time."
    - "Cross-table label resolution at the repo projection — _resolve_entity_label reads enriched extra_metadata first, falls back to f\"{ENTITY}-{id}\" legacy placeholder. Single source of truth for the Hedef column data; frontend never receives empty strings or raw entity_id."
    - "Per-component prop default that preserves a legacy consumer's behavior — hideTimestamp default = false because Recent Events relies on the inner mono timestamp; opt-in true on the audit-table consumer where the outer Zaman cell already shows the timestamp."
    - "Positional ARIA on grid-based tables — role=\"row\" on the row container + role=\"cell\" on each child cell lets RTL tests assert column ORDER via array index, not just presence by text. Catches Hedef-renders-in-wrong-cell type bugs."

key-files:
  created:
    - "Backend/tests/integration/test_admin_audit_serialization.py — 6 entity_label resolver tests (4 mandatory + 2 defensive)"
  modified:
    - "Backend/app/infrastructure/database/repositories/audit_repo.py — added _resolve_entity_label module-level helper; replaced hardcoded entity_label=None at get_global_audit row builder"
    - "Frontend2/components/admin/audit/admin-audit-row.tsx — ADMIN_AUDIT_GRID 6-track→5-track; removed 28px MoreH placeholder; added role=\"row\"/role=\"cell\"; passes hideTimestamp={true} to inner ActivityRow"
    - "Frontend2/components/admin/audit/admin-audit-table.tsx — header 5 cells (was 5 + aria-hidden filler); role=\"row\"/role=\"columnheader\" semantics"
    - "Frontend2/components/activity/activity-row.tsx — hideTimestamp?: boolean prop with default = false; conditional render of inner mono timestamp"
    - "Frontend2/components/admin/audit/admin-audit-table.test.tsx — replaced 4 legacy 14-07 tests with 4 mandatory Plan 14-16 cases + 2 carry-forward (loading + truncated)"
    - "Frontend2/components/activity/activity-row.test.tsx — appended 3 M-4 hideTimestamp prop tests"
    - ".planning/phases/14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f/14-UAT.md — Test 26 closed pending re-verify with 5-col contract + fix_summary; Test 34 viewport row updated; truth-table at line 637 closed with fix_commits"
    - ".planning/phases/14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f/deferred-items.md — 19 pre-existing workflow-editor test failures logged as out-of-scope per Rule 3"

key-decisions:
  - "Path B locked per user_decision_locked 2026-04-28: 5-column AuditTable (Zaman / Aktör / İşlem / Hedef / Detay) ships permanently. IP column dropped, NOT deferred — user verbatim 'IP kolonu sil, relevant bir kolon varsa onu koyalım'."
  - "Optional 6th column (e.g., entity_type 'Tür' badge) declined at executor discretion — most users will read entity context from Hedef anyway, and ship-to-default per the user_decision_locked instruction wins."
  - "hideTimestamp prop default = false (not true) so Recent Events card behavior is preserved without modification — that card has no outer Zaman cell, so the inner mono timestamp is the only one a user sees."
  - "role-based ARIA on grid tables (role=\"row\" + role=\"cell\" + role=\"columnheader\") — lets RTL tests assert column ORDER positionally, not just by text-search. Catches Hedef-renders-in-wrong-cell bugs that text-search cannot."
  - "_resolve_entity_label dual-key lookup — checks both extra_metadata (SQLAlchemy projection field) and metadata (wire-shape key used by in-memory test fakes) so the helper holds for every consumer without test-only branches in production code."

patterns-established:
  - "User-decision-locked execution: when PLAN.md frontmatter declares user_decision_locked + a verbatim user quote, the executor ignores historical decision-tree language and ships the locked path. No re-derivation, no escape hatch."
  - "Repo-internal label resolution: backend resolves human-readable target names at the projection block (audit_repo.py). Frontend renders the resolved string directly; no client-side cross-table lookup, no joins on read path beyond the existing user JOIN."
  - "Legacy fallback chain in resolvers: extra_metadata.{entity-specific keys} → comment-prefix variant → f\"{ENTITY}-{id}\" placeholder → None. Always non-empty for live data; None only on catastrophic schema failure."
  - "Conditional inner content via prop default = false: hideTimestamp follows the principle that legacy consumers should NOT need to pass any flag to keep working; only the new consumer (audit-table) opts in to the new behavior."

requirements-completed: [D-A8, D-D5, D-Z1, D-Z2]

# Metrics
duration: 12min
completed: 2026-04-28
---

# Phase 14 Plan 16: AuditTable 5-col Cluster D + entity_label Resolver Summary

**Backend get_global_audit emits cross-table-resolved entity_label; AuditTable ships permanent 5-column contract (Zaman / Aktör / İşlem / Hedef / Detay) with role-based ARIA + M-4 hideTimestamp prop suppressing duplicate Zaman.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-28T15:54:50Z
- **Completed:** 2026-04-28T16:06:58Z
- **Tasks:** 2 (one auto, one TDD with RED+GREEN cycle)
- **Files modified:** 8 (3 source + 2 test + 2 doc + 1 deferred-log)
- **Files created:** 1 (Backend/tests/integration/test_admin_audit_serialization.py)
- **Tests:** 9 backend pytest pass + 39 frontend vitest pass (in-scope)

## Accomplishments

- `audit_repo._resolve_entity_label` helper reads enriched `extra_metadata` (Plan 14-09) with priority chain: `task_title` → `project_name` → `milestone_title` → `artifact_name` → `comment_excerpt` (with `"yorum:"` prefix + 60-char truncate) → `f"{ENTITY}-{id}"` legacy fallback. Hedef column **never empty / never raw entity_id**.
- `ADMIN_AUDIT_GRID` reduced from `"90px 160px 180px 1fr 1fr 28px"` (6 tracks with stray MoreH) to `"90px 160px 180px 1fr 1.5fr"` (5 tracks; Path B locked per user_decision_locked).
- AdminAuditTable header drops the `<div aria-hidden />` filler (the duplicate-Zaman bug source) and adds `role="row"` + `role="columnheader"` semantics for positional RTL assertions.
- AdminAuditRow body drops the 28px MoreH placeholder and adds `role="row"` + `role="cell"`; `target || "—"` safety net for the catastrophic resolver-failure case.
- ActivityRow `hideTimestamp?: boolean` prop with explicit default `false` — audit-table consumer passes `true` to suppress the inner mono timestamp (no duplicate Zaman); Recent Events leaves the prop unset (default `false`) so its card behavior is unchanged.
- UAT Test 26 closed pending re-verify with 5-column contract + fix_summary; Test 34 viewport row updated from 6 to 5 cols; truth-table block at line 637 marked `closed_pending_reverify` with fix_commits + ip_column_status: deferred_to_v21.

## Task Commits

Each task was committed atomically. Task 2 followed full TDD cycle (RED → GREEN, no REFACTOR needed because the GREEN implementation is already minimal — no duplicated logic, no extracted helpers needed beyond the resolver helper that landed in Task 1):

1. **Task 1: Backend entity_label resolver + 6 integration tests** — `e991ce05` (feat)
2. **Task 2 RED: failing tests for 5-col grid + Hedef position + hideTimestamp prop** — `b81e61cb` (test)
3. **Task 2 GREEN: 5-col grid + role-based ARIA + hideTimestamp prop** — `2465b508` (feat)

**Plan metadata commit:** (will be created after this SUMMARY is written)

## Files Created/Modified

### Backend
- `Backend/app/infrastructure/database/repositories/audit_repo.py` — Added module-level `_resolve_entity_label(row)` helper above the `SqlAlchemyAuditRepository` class (~50 lines including detailed docstring covering the priority chain). Wired into `get_global_audit` row builder (replaces hardcoded `"entity_label": None`). Other methods (`get_project_activity`, `get_global_activity`, `get_user_activity`) intentionally unchanged — out of scope per PLAN.
- `Backend/tests/integration/test_admin_audit_serialization.py` — NEW. 6 tests in pure-Python in-memory mode (Phase 12 D-09 fake-repo pattern):
  1. `test_entity_label_resolves_project_name` — `extra_metadata.project_name="Foo"` → `"Foo"`
  2. `test_entity_label_resolves_task_title_taking_precedence_over_id_fallback` — task_title beats `f"TASK-42"`
  3. `test_entity_label_legacy_fallback_when_no_metadata` — `extra_metadata=None` + entity_type/id → `"TASK-42"` (D-D6)
  4. `test_entity_label_comment_excerpt_yields_yorum_prefix` — comment_excerpt → `"yorum: …"` (60-char preserve)
  5. (defense) `test_entity_label_empty_metadata_falls_through_to_id_label` — `{}` → falls through to legacy fallback (not None)
  6. (defense) `test_entity_label_metadata_via_wire_shape_key` — dual-key lookup honors both `extra_metadata` (SQLAlchemy projection) and `metadata` (wire-shape used by in-memory fakes)

### Frontend
- `Frontend2/components/admin/audit/admin-audit-row.tsx` — Header docstring updated to document Path B 5-track grid + must_haves.truths #2/#3 contracts. `ADMIN_AUDIT_GRID` constant changed from `"90px 160px 180px 1fr 1fr 28px"` to `"90px 160px 180px 1fr 1.5fr"`. Body row container gets `role="row"`. Each child cell (Zaman, Aktör, İşlem, Hedef, Detay) gets `role="cell"`. The Hedef cell renders `target || "—"` (was `target` alone — em-dash is the catastrophic-failure fallback). The Detay cell wraps `<ActivityRow event={item} variant="admin-table" hideTimestamp />` (was just `variant="admin-table"`). The 28px MoreH `<div aria-hidden />` placeholder is REMOVED.
- `Frontend2/components/admin/audit/admin-audit-table.tsx` — Header docstring updated to document Path B + the must_haves.truths contracts. Header row container gets `role="row"`. The 5 labeled `<div>` cells become `<div role="columnheader">`. The trailing `<div aria-hidden />` filler (the duplicate-Zaman bug source under both legacy paths) is REMOVED.
- `Frontend2/components/activity/activity-row.tsx` — `ActivityRowProps.hideTimestamp?: boolean` added with detailed JSDoc explaining the default-false rationale. The `ActivityRow` function destructures `hideTimestamp = false`. The inner mono `<div className="mono">` (rendered inside the `variant === "admin-table"` branch) is wrapped in `{!hideTimestamp && (…)}`. The `default` variant render path is unchanged (the prop is admin-table-specific; setting it on `default` is a no-op).
- `Frontend2/components/admin/audit/admin-audit-table.test.tsx` — Rewritten to cover the 4 mandatory PLAN 14-16 cases:
  - Test 1: `getAllByRole("columnheader")` returns EXACTLY 5 in order [Zaman, Aktör, İşlem, Hedef, Detay]
  - Test 2: row with `entity_label="Yapay Zeka Modülü"` renders the project name in the body row's 4th `role="cell"` (positional verification)
  - Test 3: `getAllByText(formatRelativeTime(timestamp))` returns EXACTLY 2 matches for 2 rows (no duplicate Zaman) — uses real `mapAuditToSemantic`-recognizable rows so the inner ActivityRow doesn't early-return null
  - Test 4: Path B IP-column-absent assertion + D-Z1 Risk column absence (carried forward)
  - Two carry-forward tests: loading state + truncated AlertBanner
- `Frontend2/components/activity/activity-row.test.tsx` — Appended 3 M-4 hideTimestamp tests:
  - default: `variant="admin-table"` without `hideTimestamp` prop renders the inner mono timestamp (Recent Events behavior preserved)
  - audit-table: `variant="admin-table"` with `hideTimestamp={true}` omits the inner mono timestamp (no duplicate Zaman)
  - default-variant: `hideTimestamp` prop is a no-op on `variant="default"` (no crash; Avatar-anchored layout unaffected)

### Documentation
- `.planning/phases/14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f/14-UAT.md` — Test 26 row rewritten to reflect the 5-col contract + `result: pending_reverify` + `fix_summary` block detailing the Plan 14-16 (Path B) ship; original `reported_legacy` preserved for audit trail. Test 34 viewport row updated from `"AuditTable's 6 cols"` to `"AuditTable's 5 cols (Plan 14-16 Path B)"`. Truth-table block at line 637 closed with `status: closed_pending_reverify`, `fix_commits`, and `ip_column_status: deferred_to_v21_with_user_approval_requirement`.
- `.planning/phases/14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f/deferred-items.md` — Appended Plan 14-16 section logging 19 pre-existing workflow-editor test failures (`@xyflow/react` ReactFlowProvider mocking gap) as out-of-scope per Rule 3 (only auto-fix issues caused by current task's changes). Cross-references the same family of failures already documented under Plan 14-15.

## Decisions Made

- **Optional 6th column declined.** PLAN's Step 0 user_decision_locked block invited the executor to propose a 6th `entity_type` "Tür" badge column at discretion. After reviewing the contract — Hedef already carries entity context via the resolved entity_label — adding a "Tür" badge would duplicate information for most rows. Default action per user_decision_locked: ship 5-column. Skipped.
- **`target || "—"` em-dash fallback in Hedef cell.** The backend resolver always returns a non-empty string for live data (worst case is `f"TASK-42"` legacy fallback). The em-dash only appears if the resolver returns None — which only happens when both entity_type and entity_id are missing AND no metadata keys match. Defensive belt-and-suspenders against catastrophic schema corruption; doesn't violate must_haves.truths #2 because that contract is about live data.
- **Dual-key lookup in `_resolve_entity_label` (`extra_metadata` and `metadata`).** SQLAlchemy projection rows use `extra_metadata` (the Python attr name). In-memory test fakes (`FakeAuditRepo`) and pre-mapped wire-shape rows use `metadata`. Single helper handles both without test-only branches in production.
- **Frontend role-based ARIA over `data-` attributes.** RTL's `getAllByRole("columnheader")` and `getAllByRole("row")` give standard a11y semantics + cleaner test queries than custom data attributes. The role attributes also help screen readers announce the table structure.
- **TDD applied to Task 2 only (per PLAN frontmatter).** Task 1 was `type="auto"` (not TDD); Task 2 was `type="auto" tdd="true"`. RED phase verified with vitest before GREEN; REFACTOR phase skipped because GREEN implementation has no duplicated logic that warrants extraction (the resolver lives in Task 1, the prop wiring is one-line + JSDoc).

## Deviations from Plan

None — plan executed exactly as written under the user_decision_locked constraint.

The PLAN's "PATH A NOTE" escape hatches and the "executor discretion 6th column" branch were both intentionally NOT exercised (PATH A is OFF the table per user_decision_locked; the optional 6th column was declined per executor judgment under PLAN's "Default action: ship 5-column" instruction).

## Issues Encountered

- **Test 3 (no-duplicate-Zaman) initially passed in RED for the wrong reason.** First version of the test used mock data with `action: "task.update"` (with dot) which `mapAuditToSemantic` doesn't recognize, so the inner ActivityRow short-circuited at `if (!semantic) return null` and the duplicate timestamp never rendered. Strengthened the test by switching to `entity_type: "task"` + `action: "updated"` + `field_name: "due_date"` so `mapAuditToSemantic` returns `task_field_updated`, the inner ActivityRow renders fully, and the duplicate-Zaman bug is genuinely exercised. Test then failed in RED as expected and passed in GREEN.
- **Pre-existing dev DB unavailable for HTTP integration tests in `test_admin_audit_get_global.py`.** 5 fixtures fail with ConnectionRefusedError (postgres not running locally); 3 in-memory tests still pass. This is an existing local dev setup gap unrelated to Plan 14-16. The 6 new integration tests in `test_admin_audit_serialization.py` are all in-memory and unaffected.
- **44 pre-existing TypeScript errors in unrelated test files.** All in `components/lifecycle/`, `components/workflow-editor/`, `app/(shell)/admin/layout.test.tsx`, and `hooks/use-transition-authority.test.tsx`. NONE of them are in files Plan 14-16 modified. Confirmed by running `npx tsc --noEmit -p tsconfig.json` and grepping for our modified file paths — zero hits.

## User Setup Required

None — no external service configuration required.

## TDD Gate Compliance

Plan frontmatter is `type: execute` (not `type: tdd`), so plan-level TDD gate enforcement does not apply. Task 2 individually was `tdd="true"`:

- RED commit `b81e61cb`: 4 tests added; 3 failed as expected (Test 1, 2, M-4 audit-table).
- GREEN commit `2465b508`: implementation added; all 4 tests pass plus the 3 carry-forward tests.
- REFACTOR phase skipped intentionally — the GREEN code introduces zero duplication. The single new helper (`_resolve_entity_label`) lives in Task 1 and was already self-contained at landing.

Task 1 was `type="auto"` (not TDD); the resolver helper + 6 integration tests landed in a single `feat()` commit because the test file was new (no pre-existing baseline to break).

## Next Phase Readiness

- **Plan 14-17 unblocked.** Same Wave 1 (no `depends_on`); independent of 14-16.
- **UAT row 26 ready for re-verification.** Walk to `/admin/audit`, count 5 column headers in order, confirm Hedef shows resolved names (or `f"TASK-42"` legacy for pre-Plan-14-09 rows), confirm rightmost cell is Detay text not a duplicate Zaman.
- **Path A escape hatch clearly off the table.** If a future user request re-opens IP-column scope, plan 14-19 must be spawned BEFORE re-running this plan in 6-column mode (per the original PLAN's "Path A" docstring inside the user_decision_locked block).
- **No new dependencies** for downstream plans — the entity_label resolver is repo-internal; the 5-col grid is the new public contract; the hideTimestamp prop is opt-in (defaulting to false preserves all existing consumers).

## Self-Check: PASSED

All 10 claimed files exist; all 3 claimed commit hashes resolved in `git log --all`:

| Item | Status |
|------|--------|
| `Backend/app/infrastructure/database/repositories/audit_repo.py` | FOUND |
| `Backend/tests/integration/test_admin_audit_serialization.py` | FOUND |
| `Frontend2/components/admin/audit/admin-audit-row.tsx` | FOUND |
| `Frontend2/components/admin/audit/admin-audit-table.tsx` | FOUND |
| `Frontend2/components/activity/activity-row.tsx` | FOUND |
| `Frontend2/components/admin/audit/admin-audit-table.test.tsx` | FOUND |
| `Frontend2/components/activity/activity-row.test.tsx` | FOUND |
| `.planning/.../14-UAT.md` | FOUND |
| `.planning/.../deferred-items.md` | FOUND |
| `.planning/.../14-16-SUMMARY.md` | FOUND |
| commit e991ce05 (Task 1 feat) | FOUND |
| commit b81e61cb (Task 2 RED test) | FOUND |
| commit 2465b508 (Task 2 GREEN feat) | FOUND |

---
*Phase: 14-admin-panel-prototype-taki-admin-y-netim-paneli-sayfas-n-n-f*
*Completed: 2026-04-28*
