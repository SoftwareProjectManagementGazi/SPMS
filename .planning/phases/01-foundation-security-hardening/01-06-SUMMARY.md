---
phase: 01-foundation-security-hardening
plan: 06
status: complete
completed_at: 2026-03-12
---

# Plan 01-06 Summary: Frontend Live API Wiring & Session Expiry

## What Was Built

### Task 1: Frontend → Live API (ARCH-09, ARCH-03)
- **settings/page.tsx**: Removed mock `currentUser` import; wired to `authService.getCurrentUser()` via `useEffect`. Real name/email/avatar from `GET /auth/me`.
- **manager-view.tsx**: Removed mock projects; uses `useQuery` → `projectService.getAll()`. Real project names and member counts displayed.
- **member-view.tsx**: Activity feed wired to `GET /api/v1/tasks/activity/me`. Assigned tasks already live.
- **api-client.ts** (SAFE-02): 401 response interceptor added — stores `session_expired` flag in localStorage, redirects to `/login`. Excludes `/auth/login` endpoint to avoid false trigger on wrong credentials.
- **login/page.tsx**: Reads `session_expired` flag on mount, shows "Your session has expired" destructive toast.

### Task 2: Backend Activity Endpoint & Structured Logging (SAFE-03)
- **GET /api/v1/tasks/activity/me**: Returns last 20 audit log entries for tasks assigned to current user. Uses `get_current_user` dependency only.
- **RequestLoggingMiddleware**: Starlette `BaseHTTPMiddleware` subclass in `main.py`. Emits JSON log line per request: `{"event": "http_request", "method": ..., "path": ..., "status": ..., "duration_ms": ...}`. Monitoring-ready stdout format.

### Task 3: Human Verification ✓ (approved 2026-03-12)
All 8 browser checks passed including session expiry redirect.

### Extra Work (session-scoped, committed in 5c317c9 / c48f85e)
- `seeder.py` updated to use `AuditLogModel` (was `LogModel`)
- `logs` table removed from schema; replaced by `audit_log` throughout
- `database/init.sql` updated with full Phase 1 schema (TimestampedMixin columns, recurrence columns, audit_log, indexes) — Alembic migration no longer needed for fresh DB setup
- `docs/sdd_revizyon.md` Section 7 added (REV-01 → REV-06)

## Requirements Closed
- ARCH-09: Mock data eliminated from Settings, Manager Dashboard, Member Dashboard
- ARCH-03: Frontend fully wired to live API endpoints
- SAFE-02: Session expiry redirect with toast notification
- SAFE-03: Structured JSON logging middleware (monitoring integration hook)

## Decisions
- `AUTH_TOKEN_KEY = 'auth_token'` (not `jwt_token`) — documented for future reference
- Activity endpoint returns raw audit log fields (no formal DTO) — sufficient for Phase 1 display
- Logging uses Python stdlib only — no external library added
- `init.sql` is now the single source of truth for fresh DB schema; Alembic migration remains for existing DBs

## Files Modified
- `Frontend/app/settings/page.tsx`
- `Frontend/components/dashboard/manager-view.tsx`
- `Frontend/components/dashboard/member-view.tsx`
- `Frontend/lib/api-client.ts`
- `Frontend/app/login/page.tsx`
- `Backend/app/api/v1/tasks.py`
- `Backend/app/api/main.py`
- `Backend/database/init.sql`
- `Backend/app/infrastructure/database/seeder.py`
