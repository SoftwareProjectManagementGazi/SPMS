---
phase: 10-shell-pages-project-features
fixed_at: 2026-04-21T23:30:00Z
review_path: .planning/phases/10-shell-pages-project-features/10-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 10: Code Review Fix Report

**Fixed at:** 2026-04-21T23:30:00Z
**Source review:** `.planning/phases/10-shell-pages-project-features/10-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope (BLOCK + FLAG): 8
- Fixed: 8
- Skipped: 0
- Status: all_fixed
- NOTE-level findings (NT-01 … NT-08): out of scope for this iteration (fix_scope = critical_warning).

## Fixed Issues

### BL-01: Global activity endpoint returns audit rows from projects the caller is not a member of

**Files modified:** `Backend/app/api/v1/activity.py`, `Backend/tests/integration/test_activity.py`, `Frontend2/hooks/use-projects.ts`
**Commit:** `32fe58d`
**Applied fix:** Chose approach (a) from the REVIEW.md guidance — swap `get_current_user` for `require_admin` on the `GET /api/v1/activity` route. This is the narrowest cross-tenant leak fix and matches the admin-heavy shape of current flows; no membership sub-select needed in `audit_repo`. On the frontend, `useGlobalActivity()` now catches a 403 and returns an empty `{ items: [], total: 0 }` so the Dashboard activity widget degrades gracefully for non-admin users (no scary error toast). TanStack retry disabled for 403 to avoid retry loops. Integration tests updated to cover three cases: admin 200, non-admin 403, unauthenticated 401.

### FL-01: Wizard sessionStorage draft can leak project metadata between users on the same tab

**Files modified:** `Frontend2/context/auth-context.tsx`
**Commit:** `fb9c7c8`
**Applied fix:** In `AuthProvider.logout()`, added `sessionStorage.removeItem("spms_wizard_draft")` alongside the existing localStorage + cookie cleanup. This prevents User B on a shared tab from seeing User A's in-flight wizard draft after a logout. Used the narrow fix only (per the config note) — did not add user-id namespacing, since explicit cleanup covers the current threat model.

### FL-02: `api-client.ts` uses raw string 'session_expired' instead of exported SESSION_EXPIRED_KEY

**Files modified:** `Frontend2/lib/api-client.ts`
**Commit:** `23094d5`
**Applied fix:** Import `SESSION_EXPIRED_KEY` from `@/lib/constants` and use it on the 401-interceptor path in place of the literal string. Keeps writer and reader in sync if the constant is ever renamed. Kept the write (did not remove) — future session-expired page can surface a one-shot flash without needing to plumb the constant through again.

### FL-03: AppShell calls useProjects() on every shell-group page, causing unnecessary network fetches

**Files modified:** `Frontend2/components/app-shell.tsx`
**Commit:** `24d65dd`
**Applied fix:** Replaced unconditional `useProjects()` with a direct `useQuery()` call that has `enabled: projectRouteId !== null`. Reuses the same cache key `['projects', { status: undefined }]` as the existing `useProjects(undefined)` hook so when the user navigates to `/projects` the list page hydrates from cache without a second fetch. Eliminates `GET /api/v1/projects` on `/settings`, `/my-tasks`, `/reports`, `/teams`, `/dashboard` where the header status badge can never render.

### FL-04: Dashboard activity normalization uses misleading type assertions that can render [object Object]

**Files modified:** `Frontend2/app/(shell)/dashboard/page.tsx`
**Commit:** `543c4d4`
**Applied fix:** Introduced `asString(v: unknown)` and `asStringOrNumber(v, fallback)` runtime guards and removed the `as string` / `as string | number` type-system lies from the activity-feed mapper. Non-string values now fall through to an empty-string fallback instead of being coerced via `String()` into `[object Object]`. Also dropped the legacy `item.user` and `item.occurred_at` fallback branches per the reviewer's aside — those backend shapes are no longer produced.

### FL-05: apiClient.interceptors.response swallows 401 when triggered during login page itself (forgot-password exemption)

**Files modified:** `Frontend2/lib/api-client.ts`
**Commit:** `e6e2c15`
**Applied fix:** Added `/forgot-password` to the 401-interceptor exemption list so a stale background request does not bounce a user mid-reset-flow to `/session-expired`. Also replaced fragile `includes('/auth/login')` substring matching with `endsWith()` over an explicit `AUTH_FREE_URL_SUFFIXES` whitelist, eliminating the "login/refresh" false-match risk the reviewer flagged. Restructured the interceptor so the early-exit check is a single guard (easier to extend the allow-list later).

### FL-06: UpdateProjectUseCase ignores explicit clear of nullable fields due to repo's `new_val is not None` filter

**Files modified:** `Backend/app/domain/repositories/project_repository.py`, `Backend/app/infrastructure/database/repositories/project_repo.py`, `Backend/app/application/use_cases/manage_projects.py`
**Commit:** `fb502b1`
**Applied fix:** Threaded `updated_keys: Optional[set]` from DTO → use-case → repository. `UpdateProjectUseCase.execute()` now builds `updated_keys = set(update_data.keys())` from its existing `model_dump(exclude_unset=True)` call and passes it to `project_repo.update()` alongside the `user_id=manager_id` kwarg the impl already supported. `SqlAlchemyProjectRepository.update()` uses the set as authoritative intent: fields not in it are skipped; fields in it are written regardless of value (so `{"description": null}` now clears the column). Legacy callers (`apply_process_template`, `process_config_normalizer`, phase-criteria endpoints) pass `updated_keys=None` and continue to get the old None-skip behavior unchanged. The `IProjectRepository.update()` ABC signature was updated to match, with backward-compatible defaults.

**Note:** this fix touches the Domain interface + Infrastructure impl + Application use case, so the audit-row `new_value=str(new_val) if new_val is not None else None` change also covers a secondary bug — previously `str(None)` would have been "None" in the audit log if the null-clear had slipped through.

### FL-07: CreateProjectUseCase uses deprecated datetime.utcnow() for recurring task created_at

**Files modified:** `Backend/app/application/use_cases/manage_projects.py`
**Commit:** `96d1b79`
**Applied fix:** One-line change — replaced `datetime.utcnow()` with `datetime.now(timezone.utc)` and added `timezone` to the local `from datetime import ...` inside the if-block. Silences the Python 3.12+ deprecation warning and produces a tz-aware timestamp consistent with the server_default=func.now() columns elsewhere. The deeper `IClock` port refactor the reviewer floated is intentionally deferred per the REVIEW.md guidance to keep the diff narrow.

---

_Fixed: 2026-04-21T23:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
