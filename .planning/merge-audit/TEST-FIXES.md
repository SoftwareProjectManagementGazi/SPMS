# Test Fix Report — Post-Merge

**Branch:** `merge-remote-main`
**Initial state:** 32 backend failures + 18 frontend failures = **50 total**
**Final state:** Backend **455/455** ✅ + Frontend **812/812** ✅
**Production code changes:** **0** (1 architectural smell documented for follow-up)
**Method:** Investigate root cause per test; fix production OR test (contract) as appropriate. No "make-it-green" shortcuts.

---

## Backend Fixes (32 tests)

### Group A — DB State (21 tests)

**Cause:** Test DB had stale `alembic_version='007_phase15_rbac'` from before the migration was renumbered to 012 during the merge. Tables/columns from Ayşe's 007-011 chain (`tasks.start_date`, `teams.color/department`, `milestones.start_date`, `sprints.status`, `sprint_snapshots`) were missing.

**Actions:**
1. `UPDATE alembic_version SET version_num='006_phase14_admin_panel'` (direct SQL, since `alembic stamp` couldn't resolve the stale ID).
2. Added `_column_exists()` guard to `Backend/alembic/versions/009_milestone_start_date.py` for idempotency parity with sibling migrations.
3. Added `_column_exists()` + `_table_exists()` guards to `Backend/alembic/versions/011_sprint_improvements.py` (the DB had `sprint_snapshots` from a partial prior attempt — guards needed to skip).
4. Ran `alembic upgrade head` — applied 007 through 012 cleanly.

**Tests recovered:** 21, including `test_admin_users_crud`, `test_migration_007_idempotency`, `test_login_returns_permissions`, `test_teams_leader_api` (3), `test_team_leader_repo`, `test_tasks_api_phase9::test_phase_id_filter`, plus ~12 others.

**Verdict:** No production bug — pure test infrastructure issue.

---

### Group C — Admin Destructive Ops (2 tests)

#### Test 1: `test_admin_delete_unowned_project_returns_204`
**Verdict:** Outdated test contract.

**Root cause:** Test asserted `remaining is None` after DELETE, expecting hard delete. Production has done SOFT-DELETE since Phase 01-04 (commit `9b3d4292`, 2026-03-11). `project_repo.delete()` sets `is_deleted=True`/`deleted_at=utcnow()`; the row persists. Test was written 7 weeks later (Phase 14-14, commit `8390a553`) against an outdated mental model.

**Fix:** `Backend/tests/integration/test_admin_destructive_ops.py:312-319` — replaced row-existence check with soft-delete-aware assertions on `is_deleted` and `deleted_at`.

#### Test 2: `test_pm_cannot_delete_unowned_project_returns_404` → renamed to `_returns_403`
**Verdict:** Outdated test contract + collateral fixture bug.

**Two root causes:**

**(a) Fixture bug:** `authenticated_client(role="Project Manager")` constructed an email with a space in the local-part — pydantic EmailStr rejected it.
**Fix:** `Backend/tests/conftest.py:166` — slugified `role` into the email local-part:
```python
role_slug = "".join(ch if ch.isalnum() else "_" for ch in role).lower()
email=f"authclient+{role_slug}@testexample.com"
```
This is a generic fixture improvement (works for any multi-word role).

**(b) Phase 15 contract change:** Migration 012 intentionally excluded `project.delete` from PM_PERMS — only Admin can hard-delete; PMs use the ARCHIVE flow (`project.archive`). Router-level `Depends(require_permission("project.delete"))` at `projects.py:291` fires BEFORE the use-case owner check, returning 403 PERMISSION_DENIED instead of 404.
**Fix:** `Backend/tests/integration/test_admin_destructive_ops.py:351` — renamed test to `_returns_403`, updated assertion to expect 403 + error envelope `{error_code: "PERMISSION_DENIED", missing_permission: "project.delete"}`. Updated docstring with full Phase 14 → Phase 15 transition explanation and file:line references.

Info-disclosure safety preserved: 403 fires for non-existent project IDs too, so the response doesn't leak whether the project exists.

---

### Group D — Phase Transitions + Gate (8 tests)

**Verdict (all 8):** Outdated test doubles.

**Common root cause:** Ayşe's `418bc8a2` (phase-report integration) added `await self.session.commit()` (line 182) and `await self.session.rollback()` (line 234) inside `execute_phase_transition.py`. `d357b033` replaced per-row in-memory phase mutation with `await self.task_repo.bulk_stamp_phase(ids, phase_id)` SQL bulk update (line 353). Test mocks didn't anticipate these new awaitables.

**Why only these 8:** The 5 failing integration tests are the happy-path tests that reach the line-182 commit. The 4 sibling tests in the same file pass because they expect `InvalidTransitionError` raised at lines 115-140 (before commit). The 3 unit tests use a shared `_mk_mocks` fixture.

**Fixes:**

1. `Backend/tests/unit/application/test_phase_gate_use_case.py:43-56` (`_mk_mocks`) — added 3 awaitable stubs:
```python
task_repo.bulk_stamp_phase = AsyncMock()
session.commit = AsyncMock()
session.rollback = AsyncMock()
```

2. `Backend/tests/unit/application/test_phase_gate_use_case.py:159-162` (`test_open_tasks_move_to_next_with_exceptions`) — replaced in-memory mutation check with bulk call assertion:
```python
task_repo.bulk_stamp_phase.assert_any_await([1], "nd_Tgt456DXYZ")
# Replaces: assert t1.phase_id == "nd_Tgt456DXYZ"  (in-memory mutation no longer happens)
```

3. `Backend/tests/integration/test_execute_phase_transition.py:73-103` (`FakeSession`) — added `async def commit()` and `async def rollback()` as no-op coroutines.

**🟡 Architectural smell flagged for Ayşe (NOT fixed by these test changes):**
- `execute_phase_transition.py:11-12` and `:73-76` docstrings still claim *"Commit released by FastAPI Depends lifecycle"*, but (a) `get_db_session` at `database.py:16-21` never auto-commits, and (b) the new code commits inside the use case anyway.
- **Recommendation:** Either remove the in-use-case `await self.session.commit()` (lines 182, 232) and let the router/Depends own atomicity (cleaner per CLAUDE.md DIP rule), OR update the use-case docstring to document the new pattern. Either way, the test fix is independent.

---

### Group E — Team Unit Test (1 test)

#### Test: `test_create_team_sets_owner`
**Verdict:** Outdated mock assertion.

**Root cause:** Ayşe's commits `b3085b96` + `bb422f10` + `084c7297` extended `CreateTeamUseCase.execute()` to forward 3 new DTO fields (`color`, `department`, `leader_id`) and switched the repo call from positional to keyword args. DTO + use case + repo interface were updated in lockstep — production is internally consistent; only the test's `assert_called_once_with(...)` was stale.

**Fix:** `Backend/tests/unit/application/test_manage_teams.py:28` — updated mock assertion to 6-keyword form matching the new `team_repo.create(...)` signature.

---

## Frontend Fixes (18 tests)

### Group F1 — `users-table.test.tsx` (2 tests)

**Verdict:** Missing hook mock.

**Root cause:** Phase 15 (`005a4cdd feat(15-09)`) added `useRoles()` consumption inside `UserRowActions` (line 69) for the role-picker submenu. `users-table.test.tsx` (Plan 14-03 Task 1, pre-Phase 15) mocked every other sibling admin hook but missed `use-roles`. Unmocked TanStack Query threw "No QueryClient set". Cases 1+2 pass because they short-circuit before any row renders; Cases 3+4 (which render `UserRowActions`) fail.

**Fix:** `Frontend2/components/admin/users/users-table.test.tsx:71` — added matching mock, mirroring the existing 4 sibling-hook mock pattern:
```ts
vi.mock("@/hooks/use-roles", () => ({
  useRoles: () => ({ data: { items: [], total: 0 }, isLoading: false, error: null }),
}))
```

Precedent: 3 other test files already use this exact pattern (`user-row-actions.test.tsx`, `role-card.test.tsx`, `use-roles.test.ts`).

---

### Group F2 — Lifecycle/Timeline/Project-Detail (16 tests)

All 16 failures trace to **4 deliberate refactors by Ayşe**. None are production bugs.

#### Refactor 1 — Artifact status enum migration (5 tests)
**Source:** Commit `7e161614` ("Refactor artifact statuses and implement seeding")
**Change:** Status keys renamed: `not-created/draft/done` → `not_created/in_progress/completed/approved`. SegmentedControl options: `Taslak` removed; new set is `Yok / Devam / Tamam / Onay`. Empty-state copy, CTA labels, and ConfirmDialog body all rewritten.

**Fixes in `Frontend2/components/lifecycle/artifacts-subtab.test.tsx`:**
- Test 3: assertion `status: "done"` → `"completed"`
- Test 4: button regex `"Taslak"` → `"Devam"`
- Test 8: renamed (no more "draft" status), updated dialog regex from `/Bu artefakt taslak durumunda/i` → `/silinsin mi/i`
- Test 9: button regex `/Yeni Artefakt|Özel Ekle/` → `/Artefakt Ekle/`
- Test 10: empty-state regex `/Bu metodoloji için tanımlı artefakt bulunamadı/` → `/Henüz artefakt yok/`

#### Refactor 2 — `isDone` task-completion signal (3 tests)
**Source:** Commits `d357b033` + `cba405ff` + `5d25bb8f`
**Change:** Production switched from `normalizeStatus(t.status) === "done"` to reading the backend-supplied `t.isDone` boolean. Setting only `status: "done"` in fixtures no longer counts a task as done.

**Fixes:**
- `Frontend2/components/lifecycle/overview-subtab.test.tsx:71` — added `isDone: true` to the done fixture task.
- `Frontend2/components/lifecycle/phase-gate-expand.test.tsx:127-138` (`setupTasks`) — added `isDone: i < done` to the fixture factory. **Note:** field is camelCase `isDone` (the mock bypasses the task-service mapper that would convert `is_done` snake_case → `isDone` camelCase).

#### Refactor 3 — `start_date` on tasks + milestones (5 tests)
**Source:** Commits `1aabb447` (tasks.start_date for timeline) + `a6e3b858` (milestones.start_date)
**Change A (timeline):** Filter relaxed from `t.start && t.due` to `t.due` only; unscheduled tasks now render anchored to `created_at` as effectiveStart. Empty-state copy rewritten.
**Change B (milestones):** Inline-add row gained a `start_date` input column — now 2 date inputs instead of 1.
**Change C (mapper):** `task-service.ts:161` reads `d.start_date` (snake_case from BE) not `d.start`.

**Fixes:**
- `Frontend2/components/lifecycle/milestones-subtab.test.tsx:262, 316` — select last `input[type="date"]` (targetDate) instead of first (now startDate).
- `Frontend2/components/project-detail/timeline-tab.test.tsx`:
  - Fixture: `start` → `start_date` (snake_case mapper key) for MOBIL-1 & MOBIL-2.
  - MOBIL-3 `created_at`: `2026-01-01` → `2026-04-08` (close to MOBIL-1 start so it doesn't shift chart min).
  - Test "renders SVG with one rect per scheduled task": MOBIL-3 now SHOULD render (assertion flipped from `falsy` → `truthy`).
  - Test "empty-state": regex `/başlangıç ve bitiş tarihi/` → `/bitiş tarihi olan görevler listelenir/`.
  - Test M1 milestone x-position: expected value `120` → `168` (with new `min` = 2026-04-08, target 2026-04-15 = 7 days * 24 = 168).

#### Refactor 4 — `history-card` count source (2 tests)
**Source:** Commit `5d25bb8f`
**Change:** `history-card.tsx:95` switched from `summary.done > 0 ? summary.done : ...` to `summary.total > 0 ? summary.total : ...`. Label now shows total phase tasks (broader context) instead of just done count.

**Fixes in `Frontend2/components/lifecycle/history-subtab.test.tsx`:**
- Test 3: assertion `(4)` → `(5)` (fixture has total=5, done=4).
- Test 7: added `phaseTotalCounts={{ planning: 3, execution: 3 }}` prop (without it, `summary.total = 0` → label `(0)`).

#### Refactor 5 — MembersTab real API (1 test)
**Source:** Commit `19e907f7`
**Change:** MembersTab rewritten to query `/projects/{id}/members` instead of synthesising a single row from `project.managerName`.

**Fix in `Frontend2/components/project-detail/project-detail-shell.test.tsx:22-29`:** Replaced static `apiClient.get` mock with `mockImplementation` that returns a manager record for `/members` URLs and empty arrays otherwise. Test made async with `await findByText("Ayşe")` to wait for the API resolution.

---

## 🟡 Soft Regressions Flagged (NOT fixed — design/UX concerns for Ayşe)

These are NOT test failures or correctness bugs, but worth tracking:

1. **MembersTab loses manager visibility when API empty/failed.** Before the refactor, `project.managerName` was always shown. Now, if `/projects/{id}/members` returns `[]` or 4xx, the manager becomes invisible even though their identity is known from the project payload. Consider a fallback row in MembersTab.

2. **Timeline anchors unscheduled tasks to `createdAt`.** Long-lived tasks (e.g. 6 months old with `due: tomorrow`) render misleadingly wide bars. Worth a follow-up: clamp `effectiveStart` to e.g. `min(due − 7 days, createdAt)`.

3. **Stale docstring on `execute_phase_transition.py`** (already covered in Group D). The use-case now commits internally but the docstring still claims router/Depends owns the transaction.

---

## Summary

| Group | Tests | Verdict | Production bug? |
|-------|-------|---------|-----------------|
| A (DB state) | 21 | Test infra (migration) | No |
| C (destructive ops) | 2 | Outdated contract + fixture bug | No |
| D (phase transitions) | 8 | Outdated test doubles | No |
| E (team unit) | 1 | Outdated mock assertion | No |
| F1 (users-table) | 2 | Missing useRoles mock | No |
| F2 (lifecycle/timeline) | 16 | Outdated text/DOM/date expectations | No |
| **TOTAL** | **50** | **All test contract drift** | **0 production bugs** |

**Final test status:**
- Backend: **455 passed / 0 failed / 16 skipped / 50 xfailed / 3 xpassed**
- Frontend: **812 passed / 0 failed / 118 test files**

**Production code changes:** Zero (one architectural smell on `execute_phase_transition.py` docstring documented for Ayşe to address — non-blocking).

**Migration changes:**
- `Backend/alembic/versions/009_milestone_start_date.py` — added idempotency guard
- `Backend/alembic/versions/011_sprint_improvements.py` — added idempotency guards (both column and table)

These migration changes are safe additions of `_column_exists()` / `_table_exists()` checks that make the migrations replay-safe — matches the idempotency pattern used by all other migrations in the chain (005, 006, 007, 008, 012).

**Fixture changes:**
- `Backend/tests/conftest.py` — slugified role names in email construction (works for any multi-word role)

This was caught as collateral damage during Group C investigation. It's a generic fixture robustness improvement, not specific to the merge.

---

## Verdict

The merge is **fully test-clean**. Every red test traced to either (a) test infrastructure needing migration, (b) test contracts written against pre-refactor behavior, or (c) mock setup gaps. Zero production code changes were needed to make any test pass — every fix updated a test to match an intentional production change.

The 3 soft regressions flagged above are UX/architecture concerns, not blockers — they should be discussed with Ayşe and addressed in a follow-up cycle independent of this merge.
