# Group D: Phase Transitions + Gate (8 tests)

## Common root cause

**All 8 failures stem from production code changes in commits `418bc8a2` (phase report) and `d357b033` (bulk phase updates) by Ayşe** that introduced new awaitable calls on the injected session/repos without updating the test doubles. The pre-existing docstring contract at `Backend/app/application/use_cases/execute_phase_transition.py:11-12` and inline note at lines 73-76 explicitly state: *"Commit releases advisory lock automatically … rely on FastAPI Depends session lifecycle (session.commit on return, rollback on exception) which satisfies D-10."* This contract is violated by the new code AND `get_db_session` at `Backend/app/infrastructure/database/database.py:16-21` does NOT actually auto-commit (only `yield`/`close`). The friend's changes break both unit/integration tests AND introduce a **real production concern**: the new in-use-case `await self.session.commit()` (line 182) and `await self.session.rollback()` (line 234) are now mandatory for D-10 atomicity to hold — but the in-use-case commit pattern is itself debatable architecture (clean-arch normally keeps tx control at the router/UoW boundary).

The bulk_stamp_phase refactor (`d357b033`) additionally broke `test_open_tasks_move_to_next_with_exceptions` because the test inspects in-memory `t.phase_id` mutation, which the new bulk-SQL path skips.

## Per-test breakdown

### 1. test_transition_success_no_criteria (unit, line 60)
- Error: `TypeError: object MagicMock can't be used in 'await' expression` at `execute_phase_transition.py:182`
- Production change (`418bc8a2`): added `await self.session.commit()` after the audit insert (line 182). The unit-test fixture `_mk_mocks` (`test_phase_gate_use_case.py:50-56`) only stubs `session.execute` and `session.flush` as `AsyncMock`; `session.commit` remained a plain `MagicMock` (non-awaitable).
- Verdict: **outdated test fixture** — pre-existing contract said router commits, but new prod code commits inside use case. Tests must follow.
- Fix: in `_mk_mocks`, add `session.commit = AsyncMock()` and `session.rollback = AsyncMock()`.

### 2. test_override_allowed_in_sequential_locked (unit, line 127)
- Error: same `MagicMock` await failure at line 182.
- Production change: same as #1.
- Verdict: **outdated test fixture** (shares `_mk_mocks`).
- Fix: same as #1.

### 3. test_open_tasks_move_to_next_with_exceptions (unit, line 145)
- Error: `TypeError: object MagicMock can't be used in 'await' expression` at `execute_phase_transition.py:353` (`await self.task_repo.bulk_stamp_phase(...)`).
- Production change (`d357b033`): `_apply_task_moves` was rewritten from per-row `t.phase_id = target` mutation to bulk `task_repo.bulk_stamp_phase(ids, phase_id)` SQL UPDATE (see diff lines 275-358 of that commit). The test still asserts `t1.phase_id == "nd_Tgt456DXYZ"` and `t2.phase_id == "nd_Src123DXYZ"` (lines 160-161) — those assertions are now semantically invalid because bulk SQL never mutates the in-memory Python objects.
- Verdict: **outdated test** — assertion model is wrong for the new bulk path. Also missing `bulk_stamp_phase` as `AsyncMock`.
- Fix: in `_mk_mocks`, add `task_repo.bulk_stamp_phase = AsyncMock()`; replace lines 160-161 with `task_repo.bulk_stamp_phase.assert_any_await([1], "nd_Tgt456DXYZ")` to verify the bulk call instead of inspecting object state. Add `session.commit = AsyncMock()`.

### 4-8. Integration tests (`test_execute_phase_transition.py`)
All five failures share the identical error: `AttributeError: 'FakeSession' object has no attribute 'commit'` at `execute_phase_transition.py:182`.

**Affected tests:**
- `test_all_gate_allows_any_source` (line 173)
- `test_bidirectional_pair_wise_forward_allowed` (line 233)
- `test_bidirectional_pair_wise_reverse_allowed` (line 258)
- `test_sequential_flexible_feedback_transition_allowed` (line 335)
- `test_legacy_edge_without_new_fields_treated_as_unidirectional` (line 406)

- Production change (`418bc8a2`): same line-182 commit injection.
- Why only THESE 5 of 8 in the file? The other 3 tests in the same file (`test_all_gate_does_not_help_other_targets`, `test_bidirectional_not_transitive`, `test_non_bidirectional_reverse_rejected`, `test_sequential_flexible_backward_without_edge_rejected`) all expect `InvalidTransitionError`, which is raised **before** line 182 — they short-circuit at the edge-validation block (lines 115-140) and never reach the commit. The 5 failing tests are exactly the happy-path tests that reach line 182.
- Verdict: **outdated test double** — `FakeSession` at `test_execute_phase_transition.py:73-103` predates the in-use-case commit. Note: `phase_report_repo` is not passed to the use case constructor (line 164), so the `try/except` block at lines 187-234 is skipped, leaving only the line-182 commit as the failure point.
- Fix: in `FakeSession` class, add `async def commit(self): pass` and `async def rollback(self): pass`.

## Summary

- **Production bugs found: 0 functional bugs**, but **1 architectural smell**: the docstring at `execute_phase_transition.py:11-12` and `73-76` still claims "commit released by FastAPI Depends lifecycle", which is **doubly false** — (a) `get_db_session` at `database/database.py:16-21` never commits, and (b) the new code now commits inside the use case anyway. The docstring should be updated to match reality, OR the in-use-case commit should be removed and the router should own the transaction (cleaner architecture per project's own CLAUDE.md DIP rule).
- **Outdated tests: 8/8** — all failures are mechanical test-double gaps where mocks were not updated when production added `session.commit`, `session.rollback`, and `task_repo.bulk_stamp_phase` awaits.

**Recommended approach:**
1. Update test doubles (`_mk_mocks` + `FakeSession`) to stub `commit`/`rollback`/`bulk_stamp_phase` as awaitables — restores all 8 tests with minimal churn.
2. **Separately raise a code-quality ticket** for the friend: either remove the in-use-case `session.commit()` (lines 182, 232) and let the router/Depends own atomicity per the original D-10 design, OR update the use-case docstring (lines 1-12, 73-76) to document the new in-use-case commit pattern. The current state has stale comments contradicting live behavior — a recipe for future regressions.
3. The `test_open_tasks_move_to_next_with_exceptions` assertion model (lines 160-161) needs a deeper revision because the test was written for ORM-mutation semantics that no longer exist; verifying via `bulk_stamp_phase` call arguments is the correct new pattern.

**Cited files:**
- `Backend/app/application/use_cases/execute_phase_transition.py:11-12, 73-76, 182, 232, 353`
- `Backend/app/infrastructure/database/database.py:16-21`
- `Backend/app/api/v1/phase_transitions.py:40, 68` (router lifecycle, no manual commit)
- `Backend/tests/unit/application/test_phase_gate_use_case.py:43-56, 160-161`
- `Backend/tests/integration/test_execute_phase_transition.py:73-103, 164`
- Commits: `418bc8a2` (phase report integration), `d357b033` (bulk phase updates)
