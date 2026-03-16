---
phase: 05-notifications
plan: "07"
subsystem: backend-notifications
tags: [gap-closure, migration, email, notifications]
dependency_graph:
  requires: [05-01, 05-02, 05-03, 05-04, 05-05, 05-06]
  provides: [migration_004-importable, email-delivery-wired]
  affects: [app-startup, NOTIF-01, NOTIF-04]
tech_stack:
  added: []
  patterns:
    - "BackgroundTasks email delivery guarded by user preference check"
    - "Migration file named migration_NNN.py (not NNN_description.py) for Python module validity"
key_files:
  created:
    - Backend/app/infrastructure/database/migrations/migration_004.py
  modified:
    - Backend/app/api/v1/tasks.py
    - Backend/app/api/v1/comments.py
decisions:
  - "migration_004.py is the canonical module name — 004_phase5_schema.py is not a valid Python module name (starts with digit)"
  - "Email preference guard: (pref is None or pref.email_enabled) AND per-type .get('email', True) — defaults to True when no preference row exists"
  - "BackgroundTasks inserted as first positional non-path param in endpoint signatures (FastAPI convention)"
  - "Watcher email not added — only primary assignee per NOTIF-04 specification"
metrics:
  duration: "3m"
  completed_date: "2026-03-16"
  tasks_completed: 2
  files_changed: 3
requirements_satisfied: [NOTIF-01, NOTIF-04]
---

# Phase 5 Plan 7: Gap Closure — Migration Rename + Email Wiring Summary

Closed two verified gaps blocking full Phase 5 goal achievement: renamed migration file for valid Python import and wired `send_notification_email()` into TASK_ASSIGNED and COMMENT_ADDED routes.

## What Was Built

**Gap 1 — Migration rename (NOTIF-01 blocker):** `004_phase5_schema.py` renamed to `migration_004.py` so `main.py` lifespan import resolves. File `004_phase5_schema.py` is not a valid Python module name (starts with digit); the rename follows the `migration_NNN` convention matching the import statement on line 104 of `main.py`.

**Gap 2 — Email delivery wiring (NOTIF-04):** `send_notification_email()` is now called in three endpoint code paths:
- `update_task` (PUT /{task_id}) — after TASK_ASSIGNED in-app notify
- `patch_task` (PATCH /{task_id}) — after TASK_ASSIGNED in-app notify
- `create_comment` (POST /) — after COMMENT_ADDED in-app notify for assignee

Each call is guarded by: `(pref is None or pref.email_enabled) and (pref is None or pref.preferences.get(type, {}).get("email", True))`. This ensures: email is sent when no preference row exists (default on), skipped when `email_enabled=False`, and skipped when the per-type `email` key is explicitly `False`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rename migration file to match main.py import | 396ce67 | Backend/app/infrastructure/database/migrations/migration_004.py (rename) |
| 2 | Wire send_notification_email() into tasks.py and comments.py | 95d547e | Backend/app/api/v1/tasks.py, Backend/app/api/v1/comments.py |

## Verification Results

1. `from app.infrastructure.database.migrations.migration_004 import upgrade` — PASSED
2. Both modified Python files parse cleanly — PASSED
3. `send_notification_email` present in tasks.py and comments.py — PASSED
4. `BackgroundTasks` parameter in `update_task`, `patch_task`, `create_comment` — PASSED
5. Old filename `004_phase5_schema.py` no longer exists — PASSED

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

- Migration file renamed without content changes — idempotent `upgrade()` function body preserved exactly
- Email preference guard defaults to `True` when `pref is None` — new users get email by default until they set preferences
- `BackgroundTasks` is a FastAPI special parameter injected by the framework — no `Depends()` needed, listed as first parameter after path params
- Watcher email delivery deferred per NOTIF-04 specification — only primary assignee receives email; watchers receive in-app only

## Self-Check

Checking created/modified files exist and commits are present...

## Self-Check: PASSED

| Item | Status |
|------|--------|
| Backend/app/infrastructure/database/migrations/migration_004.py | FOUND |
| Backend/app/api/v1/tasks.py | FOUND |
| Backend/app/api/v1/comments.py | FOUND |
| Commit 396ce67 (chore: rename migration_004) | FOUND |
| Commit 95d547e (feat: email wiring) | FOUND |
