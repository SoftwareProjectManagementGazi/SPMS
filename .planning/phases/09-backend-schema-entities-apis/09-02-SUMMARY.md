---
phase: 09-backend-schema-entities-apis
plan: "02"
subsystem: backend-di
tags: [di, refactor, python-imports, backward-compat, tdd]
dependency_graph:
  requires: [09-01]
  provides: [deps-package-split]
  affects: [09-04, 09-05, 09-06, 09-07]
tech_stack:
  added: []
  patterns: [by-entity-di-split, backward-compat-shim, star-re-export]
key_files:
  created:
    - Backend/app/api/deps/__init__.py
    - Backend/app/api/deps/auth.py
    - Backend/app/api/deps/user.py
    - Backend/app/api/deps/project.py
    - Backend/app/api/deps/task.py
    - Backend/app/api/deps/team.py
    - Backend/app/api/deps/audit.py
    - Backend/app/api/deps/sprint.py
    - Backend/app/api/deps/comment.py
    - Backend/app/api/deps/attachment.py
    - Backend/app/api/deps/board_column.py
    - Backend/app/api/deps/notification.py
    - Backend/app/api/deps/password_reset.py
    - Backend/app/api/deps/process_template.py
    - Backend/app/api/deps/system_config.py
    - Backend/app/api/deps/report.py
    - Backend/app/api/deps/security.py
    - Backend/app/api/deps/milestone.py
    - Backend/app/api/deps/artifact.py
    - Backend/app/api/deps/phase_report.py
    - Backend/tests/unit/test_deps_package_structure.py
    - Backend/tests/unit/test_deps_backward_compat.py
  modified:
    - Backend/app/api/dependencies.py
decisions:
  - "[D-31] dependencies.py split by-entity into deps/ sub-modules; shim preserves all legacy import paths"
  - "auth.py imports get_user_repo from deps.user directly (cross-sub-module import) because get_current_user needs user repo"
  - "notification/report/process_template/system_config use lazy imports inside function bodies to avoid circular deps at module load time"
  - "milestone/artifact/phase_report are empty stubs with __all__=[] until plans 09-05/06/07 populate them"
  - "2 pre-existing test_register_user.py failures noted as out-of-scope (MockUserRepository missing abstract methods from v1.0 IUserRepository change)"
metrics:
  duration: "5 min"
  completed: "2026-04-21"
  tasks: 2
  files: 23
---

# Phase 09 Plan 02: DI Container Split (deps/ Package) Summary

**One-liner:** Mechanical split of 221-line `dependencies.py` into 20 entity-scoped sub-modules under `deps/`, with identity-preserving backward-compat shim and 21 unit tests.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 09-02-01 | Create deps/ package with sub-modules per entity | 67e71e9 | 20 new files under Backend/app/api/deps/ |
| 09-02-02 | Convert dependencies.py to shim + backward-compat test | 2cf6ecb | Backend/app/api/dependencies.py (37-line shim) |

## Sub-Module Inventory

| File | Symbols owned |
|------|---------------|
| `auth.py` | `oauth2_scheme`, `get_db`, `get_current_user`, `_is_admin`, `require_admin` |
| `user.py` | `get_user_repo` |
| `project.py` | `get_project_repo`, `get_project_member` |
| `task.py` | `get_task_repo`, `get_task_project_member`, `get_dependency_repo` |
| `team.py` | `get_team_repo` |
| `audit.py` | `get_audit_repo` |
| `sprint.py` | `get_sprint_repo`, `get_sprint_project_member` |
| `comment.py` | `get_comment_repo` |
| `attachment.py` | `get_attachment_repo` |
| `board_column.py` | `get_board_column_repo` |
| `notification.py` | `get_notification_repo`, `get_notification_preference_repo`, `get_notification_service` |
| `password_reset.py` | `get_password_reset_repo` |
| `process_template.py` | `get_process_template_repo` |
| `system_config.py` | `get_system_config_repo` |
| `report.py` | `get_report_repo` |
| `security.py` | `get_security_service` |
| `milestone.py` | _(stub — `__all__ = []`, populated by plan 09-05)_ |
| `artifact.py` | _(stub — `__all__ = []`, populated by plan 09-06)_ |
| `phase_report.py` | _(stub — `__all__ = []`, populated by plan 09-07)_ |
| `__init__.py` | Aggregator — re-exports all symbols via `from app.api.deps.X import *` |

## Architecture Decisions

### Why auth.py imports from deps.user

`get_current_user` needs `IUserRepository` to look up the user by email from the JWT sub claim. The cross-sub-module import `from app.api.deps.user import get_user_repo` is intentional and safe: `user.py` depends only on infrastructure (no other `deps/` sub-module), so there is no circularity.

### Member guard placement

- `get_project_member` → `deps/project.py` — guards project-scoped endpoints by `project_id` path param
- `get_task_project_member` → `deps/task.py` — resolves `task_id` to `project_id` then checks membership
- `get_sprint_project_member` → `deps/sprint.py` — membership check via `?project_id=X` query param

Each guard lives alongside its primary repository factory. This keeps auth scope logic co-located with the entity it protects.

### Stubs for Phase 9 new entities

`milestone.py`, `artifact.py`, `phase_report.py` are minimal stubs with `__all__: list[str] = []`. They are imported by `__init__.py` now so that the aggregator is forward-compatible: plans 09-05/06/07 add factory functions to these files without touching `__init__.py` or `dependencies.py`.

### Shim pattern

`dependencies.py` uses two layers of re-export for belt-and-suspenders coverage:
1. `from app.api.deps import *` — picks up everything via aggregator
2. Explicit `from app.api.deps.X import Y` — ensures symbols present even if `__all__` is accidentally incomplete

This double pattern ensures `get_current_user` in `app.api.dependencies` IS the same object (same memory address) as `get_current_user` in `app.api.deps.auth` — Python import caching means the first import wins and subsequent imports return the cached object.

## Test Results

```
tests/unit/test_deps_package_structure.py  9 passed
tests/unit/test_deps_backward_compat.py   12 passed (8 parametrized identity checks)
Total: 21 passed, 0 failed
```

Pre-existing failures (out-of-scope): `test_register_user.py` 2 failures — MockUserRepository missing abstract methods (`get_all_by_role`, `search_by_email_or_name`, `update_password`) from v1.0 IUserRepository interface change. Not introduced by this plan.

## Deviations from Plan

None — plan executed exactly as specified. The only deviation candidate was the pre-existing test failures, which are properly classified as out-of-scope per scope boundary rules.

## Threat Flags

None — this plan is a pure code-organization refactor. No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- Backend/app/api/deps/__init__.py — FOUND
- Backend/app/api/deps/auth.py — FOUND
- Backend/app/api/deps/user.py — FOUND
- Backend/app/api/deps/project.py — FOUND
- Backend/app/api/deps/task.py — FOUND
- Backend/app/api/deps/milestone.py (stub) — FOUND
- Backend/app/api/deps/artifact.py (stub) — FOUND
- Backend/app/api/deps/phase_report.py (stub) — FOUND
- Backend/app/api/dependencies.py (37-line shim) — FOUND
- Backend/tests/unit/test_deps_package_structure.py — FOUND
- Backend/tests/unit/test_deps_backward_compat.py — FOUND
- Commits 084057a, 67e71e9, 14283b4, 2cf6ecb — FOUND
