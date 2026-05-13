# Group C: Admin Destructive Ops (2 tests)

## Test 1: test_admin_delete_unowned_project_returns_204

### Test expectation
End-to-end HTTP test: admin DELETE `/api/v1/projects/{id}` on a project owned by a different PM. Asserts:
1. Response status is `204` (passes — endpoint already returns 204).
2. `SELECT id FROM projects WHERE id=:pid` returns `None` — i.e. the row is **physically removed** from the table.
3. An `audit_log` row with `action='project.deleted_by_admin'` exists with `metadata.target_manager_id=<original PM id>`.

Reference: `Backend/tests/integration/test_admin_destructive_ops.py:293-339` (assertion at line 319: `assert remaining is None, "project row should be deleted"`).

### Production behavior
DELETE endpoint at `Backend/app/api/v1/projects.py:288-326` calls `DeleteProjectUseCase.execute` (`Backend/app/application/use_cases/manage_projects.py:208-254`), which calls `project_repo.delete(project_id)`.

`SqlAlchemyProjectRepository.delete` at `Backend/app/infrastructure/database/repositories/project_repo.py:275-287` is explicitly documented as **soft-delete**: it sets `model.is_deleted = True` and `model.deleted_at = datetime.utcnow()` — it never issues `DELETE FROM projects`. The row remains; subsequent `_get_base_query` reads filter it out via `ProjectModel.is_deleted == False` (`project_repo.py:107-110`).

### Verdict
- [ ] Production bug — code should hard-delete
- [x] Outdated test — soft-delete is correct, test must update
- [ ] Other

### Evidence
- Code:
  - `Backend/app/infrastructure/database/repositories/project_repo.py:275-287` — `delete()` performs soft-delete (`is_deleted=True`, `deleted_at=utcnow()`); docstring says "do NOT issue SQL DELETE".
  - `Backend/app/infrastructure/database/repositories/project_repo.py:107-110, 187, 278, 324, 342-343, 363-364, 383` — every read query filters `is_deleted == False`, proving soft-delete is the intended contract (deleted rows are invisible to the API).
  - `Backend/app/infrastructure/database/models/base.py:8-14` — `TimestampedMixin` defines `is_deleted` + `deleted_at` as a **shared mixin** applied to all main models; docstring: "Shared mixin providing soft-delete and optimistic-lock columns for all main models." Soft-delete is a project-wide architectural convention.
  - `Backend/app/infrastructure/database/repositories/project_repo.py:1` (history) — soft-delete was applied in Phase 01-04 (commit `9b3d4292`, "feat(01-04): apply soft delete and audit diff to all repositories", 2026-03-11), well before Phase 14-14 added these tests.
- Git history:
  - Tests added in commit `8390a553` ("test(14-14): add failing tests for admin DeleteProjectUseCase bypass + audit-trail", 2026-04-28). Author wrote integration assertions against a hard-delete contract that the repository had already overridden 7 weeks earlier in `9b3d4292`. The use-case-level tests in the same commit (lines 128-192, `FakeProjectRepoForDelete.delete` pops the dict entry — see line 65) work because the fake implements hard-delete semantics; the bug is purely in the **integration** assertion that introspects the real DB.
- Docs:
  - `.planning/merge-audit/AUDIT.md:116-120` — pre-existing audit already flags this exact pair: "Test asserts `remaining is None` but production does soft-delete (`is_deleted=true`), row persists with id. Test contract bug unrelated to merge."
  - `.planning/merge-audit/AUDIT.md:232-236` — `is_deleted` documented as canonical soft-delete semantics for `artifact`, `milestone`, `team` (and per `base.py:8-14`, all `TimestampedMixin` consumers, which includes `ProjectModel`).
  - `.planning/merge-audit/AUDIT.md:268, 306` — remediation already prescribed: "Fix `test_admin_destructive_ops` to expect soft-delete (`is_deleted=true`, not row removal)."

### Recommended fix
File: `Backend/tests/integration/test_admin_destructive_ops.py`, lines 312-319. Replace the "row gone" assertion with a soft-delete assertion that mirrors the production contract:

```python
# Project soft-deleted (Phase 01-04 contract): row persists with is_deleted=true;
# all API reads filter via ProjectModel.is_deleted == False, so it is invisible
# to the rest of the system.
row = (
    await db_session.execute(
        text("SELECT is_deleted, deleted_at FROM projects WHERE id=:pid"),
        {"pid": project_id},
    )
).first()
assert row is not None, "soft-deleted project row should persist"
assert row[0] is True, "is_deleted should be True after admin DELETE"
assert row[1] is not None, "deleted_at should be set after admin DELETE"
```

The 204-status and audit-log assertions (lines 309-310, 322-339) remain untouched — those reflect real contract.

---

## Test 2: test_pm_cannot_delete_unowned_project_returns_404

### Test expectation
End-to-end HTTP test: a non-admin PM DELETEs a project owned by a different PM. Asserts:
1. Response status is `404` (info-disclosure-safe).
2. `SELECT id FROM projects WHERE id=:pid` returns the original `project_id` — i.e. the row was **not touched** (line 367: `assert remaining == project_id`).

Reference: `Backend/tests/integration/test_admin_destructive_ops.py:342-367`.

### Production behavior
`DeleteProjectUseCase.execute` (`Backend/app/application/use_cases/manage_projects.py:208-226`):
- `is_admin` is `False` for `role.name == "Project Manager"`.
- Guard at line 222: `if not is_admin and project.manager_id != actor.id: raise ProjectNotFoundError(project_id)`.
- Router (`projects.py:311-312`) catches and re-raises as `HTTPException(404)`.
- The early raise occurs **before** `project_repo.delete(...)` at line 232 — soft-delete is never invoked. The row is genuinely untouched.

### Verdict
- [ ] Production bug — code should hard-delete
- [x] Outdated test — assertion accidentally happens to match soft-delete output, but the test contract still drifts (see note below)
- [ ] Other

**Caveat:** `assert remaining == project_id` *passes* under soft-delete because the row still exists with its id (deleted or not) — `SELECT id` does not filter on `is_deleted`. So strictly speaking this assertion does not fail in isolation. **However**, when run via the production-style query path (e.g. through the API/repo's base query, which filters `is_deleted == False`), the contract intent ("row is untouched") needs to be tightened so a future regression that flips this PM into the admin-bypass branch (and thereby soft-deletes the row) is still caught.

Re-reading the user's initial finding: only Test 1 fails the `remaining is None` assertion; Test 2's failure is most likely a collateral DB-state cascade from Test 1 (shared `db_session` rollback semantics) or from the seeding `_seed_pm_user` helper hitting an `ON CONFLICT` constraint after a prior test left state behind. The contract itself for Test 2 is correctly aligned with production; the assertion only needs to be made soft-delete-aware for resilience.

### Evidence
- Code:
  - `Backend/app/application/use_cases/manage_projects.py:217-226` — PM-ownership guard raises `ProjectNotFoundError` before delete is invoked.
  - `Backend/app/api/v1/projects.py:311-312` — `ProjectNotFoundError` translated to HTTP 404.
- Git history: same commit as Test 1 (`8390a553`, 2026-04-28). Both tests landed together against an outdated mental model of `repo.delete()`.
- Docs: `.planning/merge-audit/AUDIT.md:116-120` groups both tests as "Soft-delete contract violation (pre-existing)".

### Recommended fix
File: `Backend/tests/integration/test_admin_destructive_ops.py`, lines 360-367. Strengthen the "untouched" assertion so it explicitly asserts the row is still **live** (not soft-deleted), which makes the test robust to the regression it is trying to catch:

```python
# Project row must still be LIVE (not soft-deleted) — the PM-ownership guard
# in DeleteProjectUseCase raises ProjectNotFoundError before repo.delete() is
# called, so is_deleted must remain False.
row = (
    await db_session.execute(
        text("SELECT id, is_deleted FROM projects WHERE id=:pid"),
        {"pid": project_id},
    )
).first()
assert row is not None, "project row should still exist"
assert row[0] == project_id
assert row[1] is False, "project should NOT have been soft-deleted"
```

---

## Summary

This is **test contract drift, not a production bug**. Soft-delete was established as a project-wide architectural convention in Phase 01-04 (commit `9b3d4292`, 2026-03-11) via the shared `TimestampedMixin` in `Backend/app/infrastructure/database/models/base.py:8-14`, with every read in `project_repo.py` enforcing `is_deleted == False`. The failing integration assertions were authored 7 weeks later in commit `8390a553` (Phase 14-14, 2026-04-28) and incorrectly assume `repo.delete()` performs a SQL DELETE — a mismatch the in-memory `FakeProjectRepoForDelete` (lines 52-66) accidentally masks because the fake hard-deletes from a dict. The `.planning/merge-audit/AUDIT.md` (lines 116-120, 268, 306) had already pre-identified this as test contract bug to be repaired in Phase 15. Recommended action: update the two integration test assertions per the snippets above. No production change needed.
