---
phase: 02-authentication-team-management
plan: "05"
subsystem: auth-security
tags: [auth, password-reset, account-lockout, rate-limiting, slowapi]
dependency_graph:
  requires: ["02-01", "02-02"]
  provides: ["password-reset-flow", "account-lockout", "rate-limiting"]
  affects: ["auth-endpoints", "login-flow"]
tech_stack:
  added: ["slowapi==0.1.9", "limits==5.8.0"]
  patterns: ["in-memory lockout store", "single-use token", "no-enumeration 204 pattern", "limiter decorator pattern"]
key_files:
  created:
    - Backend/app/application/services/lockout.py
    - Backend/app/application/services/__init__.py
    - Backend/app/application/use_cases/request_password_reset.py
    - Backend/app/application/use_cases/confirm_password_reset.py
    - Backend/app/infrastructure/database/repositories/password_reset_repo.py
  modified:
    - Backend/app/application/use_cases/login_user.py
    - Backend/app/domain/repositories/user_repository.py
    - Backend/app/infrastructure/database/repositories/user_repo.py
    - Backend/app/api/v1/auth.py
    - Backend/app/api/main.py
    - Backend/app/api/dependencies.py
    - Backend/requirements.txt
    - Backend/tests/unit/application/test_password_reset.py
    - Backend/tests/unit/application/test_account_lockout.py
decisions:
  - "In-memory dict (_lockout_store) used for lockout state — no DB dependency, restarts clear state (intentional for dev)"
  - "RequestPasswordResetUseCase imports settings directly from app.infrastructure.config (no get_settings function — settings is a module-level singleton)"
  - "ISecurityService imported from app.application.ports.security_port in use cases (not from interfaces/ which does not exist)"
  - "update_password() added to both IUserRepository interface and SqlAlchemyUserRepository — uses direct model fetch then setattr pattern"
  - "Rate-limiting xfail integration tests remain as xfail — they require a live server; promoted to real tests in a future integration plan"
metrics:
  duration_minutes: 4
  completed_date: "2026-03-12"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 9
---

# Phase 02 Plan 05: Password Reset, Account Lockout, and Rate Limiting Summary

**One-liner:** In-memory account lockout (5 attempts → 15min lock), SHA-256 token-based password reset flow (no user enumeration, single-use, 30min expiry), and slowapi rate limiting on /auth/login (10/min) and /auth/register (5/min).

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Password reset use cases + lockout module + repo | e8fa4b1 | lockout.py, request_password_reset.py, confirm_password_reset.py, password_reset_repo.py, login_user.py |
| 2 | Password reset endpoints + slowapi rate limiting | d822b38 | auth.py, main.py, dependencies.py, requirements.txt |

## What Was Built

### Account Lockout (AUTH-04)
- `Backend/app/application/services/lockout.py` — `LockoutEntry` dataclass + `check_lockout`, `record_failed_attempt`, `clear_lockout` functions operating on in-memory `_lockout_store` dict
- Threshold: 5 failed attempts → 15-minute lock
- Auto-unlock: `check_lockout` compares `locked_until` with `datetime.utcnow()` — no scheduled job needed
- `LoginUserUseCase` extended with lockout integration: lookup → check_lockout (HTTP 423 with unlock ISO timestamp) → verify_password → record_failed_attempt on failure → clear_lockout on success

### Password Reset (AUTH-03)
- `RequestPasswordResetUseCase` — generates `secrets.token_urlsafe(32)`, stores SHA-256 hash, always returns without raising (204, no user enumeration), logs reset link at INFO level in dev
- `ConfirmPasswordResetUseCase` — validates token hash, checks `used_at is None` and `expires_at > now`, calls `update_password` + `mark_used`, raises HTTP 400 with consistent message on any failure
- `SqlAlchemyPasswordResetRepository` — `create/get_by_hash/mark_used` following the user_repo session pattern
- `IUserRepository` and `SqlAlchemyUserRepository` extended with `update_password(user_id, password_hash)`

### Rate Limiting (SEC-01)
- `slowapi` installed (v0.1.9) and added to `requirements.txt`
- `main.py`: `Limiter(key_func=get_remote_address)` on `app.state.limiter` + `RateLimitExceeded` exception handler
- `auth.py`: `@limiter.limit("10/minute")` on `/login`, `@limiter.limit("5/minute")` on `/register`
- `request: Request` added as first parameter on both rate-limited endpoints (slowapi requirement)

## Test Results

```
10 passed, 2 xfailed in 0.17s
```

- `test_password_reset.py`: 5 tests pass (request/no-enumeration, expiry, single-use, update-password)
- `test_account_lockout.py`: 5 tests pass (5-failures lock, counter-reset, auto-unlock, unlock-time, correct-pw-rejected-during-lock)
- `test_rate_limiting.py`: 2 xfail (integration tests — require running server; left as xfail per plan)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Method] update_password not in IUserRepository**
- **Found during:** Task 1
- **Issue:** `ConfirmPasswordResetUseCase` calls `user_repo.update_password()` but the abstract interface only had `get_by_email`, `create`, `get_by_id`
- **Fix:** Added `update_password(user_id, password_hash)` as abstract method to `IUserRepository` and implemented in `SqlAlchemyUserRepository`
- **Files modified:** `Backend/app/domain/repositories/user_repository.py`, `Backend/app/infrastructure/database/repositories/user_repo.py`
- **Commit:** e8fa4b1

**2. [Rule 3 - Blocking Import] No get_settings() function in config**
- **Found during:** Task 1
- **Issue:** Plan's request_password_reset.py called `get_settings()` but `app/infrastructure/config.py` only exports a `settings` singleton, not a factory function
- **Fix:** Changed import to use `settings` directly: `from app.infrastructure.config import settings`
- **Files modified:** `Backend/app/application/use_cases/request_password_reset.py`
- **Commit:** e8fa4b1

**3. [Rule 3 - Blocking Import] No app/application/interfaces/i_security_service.py**
- **Found during:** Task 1
- **Issue:** Plan referenced `from app.application.interfaces.i_security_service import ISecurityService` but this path does not exist
- **Fix:** Used the correct path `from app.application.ports.security_port import ISecurityService`
- **Files modified:** `Backend/app/application/use_cases/confirm_password_reset.py`
- **Commit:** e8fa4b1

## Self-Check: PASSED
