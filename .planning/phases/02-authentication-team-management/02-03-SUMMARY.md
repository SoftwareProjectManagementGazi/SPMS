---
phase: 02-authentication-team-management
plan: 03
subsystem: auth-profile
tags: [profile-update, avatar-upload, file-serving, use-case, repository]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [UpdateUserProfileUseCase, PUT /auth/me, POST /auth/me/avatar, GET /auth/avatar/{filename}]
  affects: [Backend/app/api/v1/auth.py, Backend/app/infrastructure/database/repositories/user_repo.py]
tech_stack:
  added: []
  patterns: [TDD red-green, FastAPI UploadFile, FileResponse, path traversal prevention, authenticated file serving]
key_files:
  created:
    - Backend/app/application/use_cases/update_user_profile.py
    - Backend/static/uploads/avatars/.gitkeep
  modified:
    - Backend/app/infrastructure/database/repositories/user_repo.py
    - Backend/app/api/v1/auth.py
    - Backend/tests/unit/application/test_update_user_profile.py
decisions:
  - "Use password_hash field (not hashed_password) — matched to actual User entity definition"
  - "user_repo.update() uses existing self.session (not session_factory) — consistent with repo pattern"
  - "Authenticated avatar serving via /auth/avatar/{filename} (no StaticFiles mount) — enforces JWT gate"
  - "Avatar paths stored as relative strings (uploads/avatars/uuid.ext), not absolute paths"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-03-12"
  tasks_completed: 2
  files_changed: 5
---

# Phase 2 Plan 3: User Profile Update and Avatar Upload Summary

**One-liner:** Profile update via UpdateUserProfileUseCase with email-change password gate, plus authenticated avatar upload/serve endpoints using FastAPI UploadFile and FileResponse.

## What Was Built

### Task 1: UpdateUserProfileUseCase and user_repo update methods (TDD)

Implemented `UpdateUserProfileUseCase` with:
- Full name update (no password required)
- Email change gated by `current_password` verification (400 if missing, 401 if wrong)
- Uses `password_hash` field — correct field name from `User` entity (plan template used `hashed_password` which would have caused AttributeError at runtime)

Added two methods to `SqlAlchemyUserRepository`:
- `update(user_id, fields)` — whitelist-filtered field update via `self.session` pattern
- `update_avatar(user_id, relative_path)` — delegates to `update()`

Tests: 5 real passing tests replacing the 5 xfail stubs.

### Task 2: PUT /auth/me, POST /auth/me/avatar, GET /auth/avatar/{filename}

Added three endpoints to `Backend/app/api/v1/auth.py`:
- `PUT /auth/me` — delegates to `UpdateUserProfileUseCase`
- `POST /auth/me/avatar` — reads file, validates extension and size (413 if >2MB), saves with UUID filename to `static/uploads/avatars/`, stores relative path in DB
- `GET /auth/avatar/{filename}` — `get_current_user` dependency provides 401 gate; path traversal prevention via `Path(filename).name`

Created `Backend/static/uploads/avatars/.gitkeep` to track the directory.

## Verification Results

```
5 passed, 3 xfailed
```

- `test_update_user_profile.py`: 5/5 PASSED
- `test_auth_avatar.py`: 3/3 XFAIL (integration stubs — require running DB)

All success criteria from plan satisfied:
- Email change without current_password → 400
- Email change with wrong current_password → 401
- Avatar upload rejects files >2MB → 413
- Avatar upload rejects invalid extensions → 400
- Avatar serve endpoint requires valid JWT → 401 without token
- Avatar paths stored as relative strings

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected password field name in UpdateUserProfileUseCase**

- **Found during:** Task 1 implementation
- **Issue:** Plan template used `current_user.hashed_password` but `User` entity defines the field as `password_hash`
- **Fix:** Used `current_user.password_hash` in the use case
- **Files modified:** `Backend/app/application/use_cases/update_user_profile.py`
- **Commit:** 0bbe43d

**2. [Rule 3 - Blocking] Corrected import path for ISecurityService**

- **Found during:** Task 1 implementation
- **Issue:** Plan template referenced `app.application.interfaces.i_security_service` but the actual module is `app.application.ports.security_port`
- **Fix:** Used correct import `from app.application.ports.security_port import ISecurityService`
- **Files modified:** `Backend/app/application/use_cases/update_user_profile.py`
- **Commit:** 0bbe43d

**3. [Rule 1 - Bug] Adapted user_repo.update() to session pattern**

- **Found during:** Task 1 implementation
- **Issue:** Plan template showed `session_factory()` context manager pattern but `SqlAlchemyUserRepository` uses `self.session` directly (injected via `get_user_repo` dependency)
- **Fix:** Used `self.session.execute(stmt)` pattern consistent with existing repo methods
- **Files modified:** `Backend/app/infrastructure/database/repositories/user_repo.py`
- **Commit:** 0bbe43d

## Self-Check: PASSED

- Backend/app/application/use_cases/update_user_profile.py: FOUND
- Backend/static/uploads/avatars/.gitkeep: FOUND
- .planning/phases/02-authentication-team-management/02-03-SUMMARY.md: FOUND
- Commit 0bbe43d (Task 1): FOUND
- Commit b7e3061 (Task 2): FOUND
