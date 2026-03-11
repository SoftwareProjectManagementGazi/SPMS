---
phase: 01-foundation-security-hardening
plan: "01"
subsystem: testing
tags: [test-scaffolding, rbac, audit-log, cors, soft-delete, nyquist]
dependency_graph:
  requires: []
  provides:
    - Wave 0 test scaffolds (Nyquist compliance for Plans 01-02 through 01-06)
    - RBAC task endpoint test stubs (for Plan 01-03)
    - Startup validation test stubs (for Plan 01-02)
    - Soft-delete test stubs (for Plan 01-02)
    - Audit log test stubs (for Plan 01-02)
    - DB index test stubs (for Plan 01-04)
    - CORS test stubs (for Plan 01-03)
  affects:
    - Backend/tests/integration/api/test_auth_rbac.py
    - Backend/tests/integration/api/test_rbac_tasks.py
    - Backend/tests/unit/test_startup_validation.py
    - Backend/tests/unit/test_config.py
    - Backend/tests/unit/infrastructure/test_task_repo_soft_delete.py
    - Backend/tests/integration/infrastructure/test_audit_log.py
    - Backend/tests/integration/infrastructure/test_indexes.py
    - Backend/tests/integration/api/test_cors.py
tech_stack:
  added: []
  patterns:
    - pytest.mark.xfail stubs for Nyquist-compliant test scaffolding
    - anaconda3 base environment as project's Python runtime (no virtualenv in ScriptSecureProje_env)
key_files:
  created:
    - Backend/tests/integration/api/test_rbac_tasks.py
    - Backend/tests/unit/test_startup_validation.py
    - Backend/tests/unit/test_config.py
    - Backend/tests/unit/infrastructure/__init__.py
    - Backend/tests/unit/infrastructure/test_task_repo_soft_delete.py
    - Backend/tests/integration/infrastructure/test_audit_log.py
    - Backend/tests/integration/infrastructure/test_indexes.py
    - Backend/tests/integration/api/test_cors.py
  modified:
    - Backend/tests/integration/api/test_auth_rbac.py
decisions:
  - "Use pytest.mark.xfail (not skip) so all stubs appear in collection output and satisfy Nyquist rule"
  - "Anaconda3 base env is the Python runtime — ScriptSecureProje_env lacks pytest_asyncio"
  - "Unit test stubs use synchronous markers where pytest-asyncio is not needed; async stubs import only builtins"
metrics:
  duration_minutes: 6
  completed_date: "2026-03-11"
  tasks_completed: 3
  files_created: 8
  files_modified: 1
---

# Phase 1 Plan 01: Wave 0 Test Scaffolds Summary

**One-liner:** 8 pytest xfail stubs created across RBAC, startup validation, config, soft-delete, audit log, DB indexes, and CORS — fixing broken status_id reference in test_auth_rbac.py and establishing Nyquist-compliant test coverage for all Phase 1 implementation plans.

## What Was Built

This plan created the complete Wave 0 test scaffold required before any implementation task in Phase 1 can have a verified automated check command.

### Files Created

| File | Stubs | Target Plan |
|------|-------|-------------|
| `test_rbac_tasks.py` | 6 xfail stubs — non-member 403 + admin bypass | 01-03 |
| `test_startup_validation.py` | 3 xfail stubs — JWT/DB default secret detection | 01-02 |
| `test_config.py` | 3 xfail stubs — DEBUG flag, CORS parsing, whitespace stripping | 01-02 |
| `test_task_repo_soft_delete.py` | 3 xfail stubs — soft-delete filter, is_deleted field, admin guard | 01-02/01-03 |
| `test_audit_log.py` | 3 xfail stubs — task/project field-level diffs, user_id tracking | 01-02 |
| `test_indexes.py` | 4 xfail stubs — tasks and projects index existence via DB reflection | 01-04 |
| `test_cors.py` | 2 xfail stubs — non-allowlisted rejection, allowlisted acceptance | 01-03 |

### Files Fixed

- `test_auth_rbac.py`: Removed two `status_id=1` arguments from `Task()` constructors (field does not exist in `TaskModel` — status derives from `column_id`). This was a blocking collection error.

## Verification

Full Wave 0 check — all 28 tests collected with zero import errors:

```
28 tests collected in 0.05s
```

All stub tests are marked `xfail` so they appear in collection output and count toward Nyquist coverage without producing false failures.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Python runtime discovery**
- **Found during:** Task 1 verification
- **Issue:** `python` / `python3` resolve to Windows Store stubs on this machine; `ScriptSecureProje_env` conda env lacks `pytest_asyncio`
- **Fix:** Used `anaconda3` base environment (`/c/Users/yusti/anaconda3/python.exe`) which has all required packages
- **Files modified:** None (environment discovery only)
- **Commit:** N/A (no code change)

No other deviations — plan executed as written.

## Decisions Made

1. **xfail over skip**: All stubs use `pytest.mark.xfail` so they appear in `--collect-only` output and satisfy the Nyquist rule (every implementation plan can reference a runnable verify command).
2. **Anaconda3 base env**: The project's functional pytest runtime is the base conda env, not the named `ScriptSecureProje_env`.
3. **No `__init__.py` for integration subdirectories**: Existing integration test subdirs (api, infrastructure) do not use `__init__.py` — new files followed the same convention. Unit `infrastructure/` subdir received `__init__.py` to match the existing `application/` subdir pattern.

## Self-Check: PASSED

All 8 created/modified files exist on disk. All 3 task commits verified in git log (ee472a0, c8ffb40, 8c3037d). 28 tests collected by pytest with zero import errors.
