---
phase: 10-shell-pages-project-features
reviewed: 2026-04-21T23:00:00Z
depth: deep
files_reviewed: 43
files_reviewed_list:
  - Backend/app/api/v1/activity.py
  - Backend/app/api/v1/process_templates.py
  - Backend/app/api/v1/projects.py
  - Backend/app/application/dtos/project_dtos.py
  - Backend/app/application/use_cases/get_global_activity.py
  - Backend/app/application/use_cases/manage_projects.py
  - Backend/app/domain/exceptions.py
  - Backend/app/domain/repositories/audit_repository.py
  - Backend/app/infrastructure/database/repositories/audit_repo.py
  - Backend/app/infrastructure/database/repositories/project_repo.py
  - Backend/app/infrastructure/database/seeder.py
  - Backend/tests/integration/test_activity.py
  - Frontend2/app/(auth)/forgot-password/page.tsx
  - Frontend2/app/(auth)/layout.tsx
  - Frontend2/app/(auth)/login/page.tsx
  - Frontend2/app/(auth)/session-expired/page.tsx
  - Frontend2/app/(shell)/dashboard/page.tsx
  - Frontend2/app/(shell)/layout.tsx
  - Frontend2/app/(shell)/projects/[id]/page.tsx
  - Frontend2/app/(shell)/projects/new/page.tsx
  - Frontend2/app/(shell)/projects/page.tsx
  - Frontend2/app/(shell)/settings/page.tsx
  - Frontend2/app/globals.css
  - Frontend2/app/layout.tsx
  - Frontend2/components/app-shell.tsx
  - Frontend2/components/dashboard/activity-feed.tsx
  - Frontend2/components/dashboard/methodology-card.tsx
  - Frontend2/components/dashboard/portfolio-table.tsx
  - Frontend2/components/dashboard/stat-card.tsx
  - Frontend2/components/header.tsx
  - Frontend2/components/logo-mark.tsx
  - Frontend2/components/primitives/input.tsx
  - Frontend2/components/projects/archive-banner.tsx
  - Frontend2/components/projects/confirm-dialog.tsx
  - Frontend2/components/projects/project-card.tsx
  - Frontend2/components/sidebar.tsx
  - Frontend2/components/toast/index.tsx
  - Frontend2/context/auth-context.tsx
  - Frontend2/hooks/use-projects.ts
  - Frontend2/lib/api-client.ts
  - Frontend2/lib/constants.ts
  - Frontend2/middleware.ts
  - Frontend2/services/auth-service.ts
  - Frontend2/services/project-service.ts
findings:
  block: 1
  flag: 7
  note: 8
  total: 16
status: blocked
---

# Phase 10: Code Review Report

**Reviewed:** 2026-04-21T23:00:00Z
**Depth:** deep
**Files Reviewed:** 43
**Status:** blocked

## Summary

Phase 10 delivers a ground-up Frontend2 rebuild (auth flow, shell, dashboard, projects list, create wizard, settings, archive banner, header wiring), the backend global activity endpoint, seeder additions for process templates + D-36 fields, and integration tests. Overall the code is cleanly written, respects Clean Architecture DIP in the Backend (application layer has zero infrastructure imports), and the SSR-safe auth flow is handled correctly.

**The review surfaces one BLOCK-severity authorization concern** in the backend — `GET /api/v1/activity` exposes every audit_log row (across every project) to any authenticated user, including `old_value` / `new_value` text for projects the user is not a member of. Even though the docstring says this is intentional per D-28, the endpoint returns ALL rows unconditionally, which is a broader surface than a typical tenant-isolated dashboard feed. Needs a product-level decision (see BL-01) before merging to production.

Other notable findings: the wizard sessionStorage draft persists across users on the same tab, the `session_expired` string is not using the exported constant, `useProjects()` in the header triggers a network request on every page in the shell, and several theme-related edge cases deserve attention but none block merging.

## Block Issues

### BL-01: Global activity endpoint returns audit rows from projects the caller is not a member of

**File:** `Backend/app/api/v1/activity.py:20-37`, `Backend/app/infrastructure/database/repositories/audit_repo.py:183-239`

**Issue:** `GET /api/v1/activity` is gated on `get_current_user` only (any authenticated user) and `get_global_activity()` emits a plain `SELECT ... FROM audit_log` with no WHERE conditions. The row shape includes `entity_type`, `entity_id`, `field_name`, `old_value`, `new_value`, and `extra_metadata`. This means:

- A Member user who is *not* on project X can see every status transition, every title/description edit, and every field change on project X, including the text content of those fields (`old_value` / `new_value` are unfiltered).
- The project-scoped sibling endpoint (`GET /projects/{project_id}/activity`) correctly enforces `get_project_member`, but the global variant bypasses that.
- `extra_metadata` on phase transitions carries `source_phase_id`, `target_phase_id`, `reason` text — again, all projects visible.

The docstring labels this intentional ("D-28: global activity feed across all projects"), but the prior `/projects/{project_id}/activity` path was explicitly membership-scoped. The dashboard widget only renders a user-first-name + verb summary, so the non-public fields (`old_value`, `new_value`, `extra_metadata`) are shipped to the browser without being consumed by the UI — they are a data leak, not a feature.

**Fix:** Pick one of the following mitigations and document the decision in `10-DISCUSSION-LOG.md`:

```python
# Option A (preferred): scope to rows the user is authorized to see
# In audit_repo.get_global_activity, filter entity_id IN (projects where user is member or manager).
# Admins bypass the filter.
async def get_global_activity(
    self,
    user_id: int,
    is_admin: bool,
    limit: int = 20,
    offset: int = 0,
) -> Tuple[List[dict], int]:
    from app.infrastructure.database.models.project import ProjectModel, project_members
    if is_admin:
        # no filter
        ...
    else:
        # restrict to audit rows whose entity is a project the user belongs to,
        # or whose entity is a task whose project the user belongs to.
        # Use a CTE or sub-select against project_members + ProjectModel.manager_id.
        ...
```

```python
# Option B: trim the response shape to what the Dashboard widget actually needs
# (user_name, action, entity_type, timestamp). This does NOT close the cross-tenant
# enumeration channel but at least stops leaking the textual diffs.
# Update ActivityItemDTO in application/dtos/activity_dtos.py to drop old_value,
# new_value, metadata, field_name from the response_model.
```

**Recommendation:** Option A is the correct security fix. Option B is a defensive-in-depth compromise if A is deemed out of scope for Phase 10 — but this must be called out explicitly as a deferred-security-issue in the phase summary.

---

## Flag Issues

### FL-01: Wizard sessionStorage draft can leak project metadata between users on the same tab

**File:** `Frontend2/app/(shell)/projects/new/page.tsx:10-154, 218`

**Issue:** The wizard persists `name`, `key`, `description`, `startDate`, `endDate`, `templateId`, `methodology`, `columns` to `sessionStorage['spms_wizard_draft']`. The draft is only removed on successful project submit (line 218). It is NOT cleared on logout.

On a shared device or a kiosk-style browser profile, this flow can leak the previous user's in-flight wizard state:

1. User A starts creating "Q2 Acquisition" project, fills Step 1 fields, closes the tab (or navigates away, but stays on same tab after going through login).
2. User A logs out; sessionStorage persists because logout does not clear it.
3. User B logs in on the same tab → navigates to `/projects/new` → sees User A's project name, description, and template selection.

`sessionStorage` is per-tab but survives logout. Project names are frequently sensitive (project codenames, client engagements). Description could be confidential.

**Fix:**

```typescript
// In context/auth-context.tsx logout callback:
const logout = React.useCallback(() => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  document.cookie = `auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  // Clear wizard draft and any other per-user transient state
  if (typeof window !== "undefined") {
    sessionStorage.removeItem('spms_wizard_draft')
  }
  setUser(null)
  setToken(null)
}, [])
```

Also recommend namespacing the draft key with `user.id` so that stale drafts cannot appear under a new user even if a cleanup is missed:

```typescript
const WIZARD_DRAFT_KEY = user?.id ? `spms_wizard_draft_${user.id}` : 'spms_wizard_draft'
```

### FL-02: `api-client.ts` uses raw string `'session_expired'` instead of exported `SESSION_EXPIRED_KEY`

**File:** `Frontend2/lib/api-client.ts:42`; `Frontend2/lib/constants.ts:2`

**Issue:** `constants.ts` exports `SESSION_EXPIRED_KEY = 'session_expired'` but `api-client.ts` re-imports only `AUTH_TOKEN_KEY` and writes the literal `'session_expired'` on line 42. `session-expired/page.tsx` imports `AUTH_TOKEN_KEY` but does not read the session_expired marker at all — it just clears `AUTH_TOKEN_KEY` and the cookie.

Two practical risks:

1. If someone later renames `SESSION_EXPIRED_KEY`, the api-client will silently diverge.
2. No consumer reads this key today, so the write on line 42 is dead code / not observable — misleading for anyone trying to reason about the session-expired flow.

**Fix:**

```typescript
// Frontend2/lib/api-client.ts
import { AUTH_TOKEN_KEY, SESSION_EXPIRED_KEY } from '@/lib/constants'
// ...
localStorage.setItem(SESSION_EXPIRED_KEY, 'true')
```

Either also read the marker in `session-expired/page.tsx` (to display a one-shot flash message), or remove the write entirely in api-client.ts. Keeping a write with no reader is dead state.

### FL-03: `AppShell` calls `useProjects()` on every shell-group page, causing unnecessary network fetches

**File:** `Frontend2/components/app-shell.tsx:48`

**Issue:** `AppShell` is rendered inside the (shell) layout for every route in `/dashboard`, `/projects`, `/settings`, `/my-tasks`, `/reports`, `/teams`. Line 48 unconditionally calls `useProjects()` (no status filter) to hydrate the project header badge. Consequences:

1. On `/settings` or `/my-tasks` pages where the badge is never rendered (`projectRouteId` is null), the app still fires `GET /api/v1/projects` and hydrates the TanStack Query cache.
2. For non-admin users, the list is automatically scoped via `ListProjectsUseCase` to their memberships — but the query still runs.
3. The comment on line 47 says "no extra network request when navigating from /projects to /projects/{id}; fetches once on first visit if cache is empty" — but this implies the query runs on *every* shell route before the user ever visits /projects.

**Fix:** Gate the query on `projectRouteId`:

```typescript
const { data: allProjects = [] } = useProjects(undefined, {
  enabled: projectRouteId !== null,
})
// TanStack Query v5:
const { data: allProjects = [] } = useQuery({
  queryKey: ['projects', { status: undefined }],
  queryFn: () => projectService.getAll(),
  enabled: projectRouteId !== null,
})
```

Or, if keeping cache warm for the whole shell is desirable, narrow the fetched fields to `id, name, status` only (requires a backend summary endpoint or response shape).

### FL-04: Dashboard activity normalization uses misleading type assertions that can render `[object Object]`

**File:** `Frontend2/app/(shell)/dashboard/page.tsx:46-63`

**Issue:** The `.map(...)` callback casts every field with `as string | number` / `as string` even though `item[field]` is typed as `unknown`. TypeScript does not enforce the runtime type, so if the backend ever changes (or a test stub returns) a non-string value — e.g. an object for `action` — the frontend will happily render `[object Object]` in the activity feed. The `?? "Unknown"` fallback does NOT catch non-null non-strings.

Concrete failure mode: if the backend eventually adds `action: { type: "task_created", task_id: 42 }` instead of `action: "task_created"`, the cast succeeds silently and the UI prints `[object Object] [object Object]` next to the user's name.

**Fix:** Use `typeof` runtime guards, or rely on a single well-typed mapper. Example:

```typescript
const asString = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : fallback
const asStringOrNumber = (v: unknown, fallback: string | number): string | number =>
  typeof v === 'string' || typeof v === 'number' ? v : fallback

return raw.map((item: Record<string, unknown>, idx: number) => ({
  id: asStringOrNumber(item.id, idx),
  action: asString(item.action) || asString(item.description),
  user_name: asString(item.user_name) || asString(item.actor_name) || 'Unknown',
  user_avatar: typeof item.user_avatar === 'string' ? item.user_avatar : null,
  timestamp: asString(item.timestamp) || asString(item.created_at),
  entity_type: asString(item.entity_type),
}))
```

Also note: the fallback chain `(item.actor_name as string) ?? (item.user as string)` presumes legacy backend shapes that no longer exist. If never reached, remove for readability.

### FL-05: `apiClient.interceptors.response` swallows 401 when triggered during login page itself

**File:** `Frontend2/lib/api-client.ts:31-50`

**Issue:** The 401 interceptor short-circuits redirects when:
- path includes `/login`
- path includes `/session-expired`
- the request URL includes `/auth/login`

These guards are correct for the happy path. But if a user sits on `/forgot-password` and some background request (e.g. a stale TanStack cache refetch) hits a 401, the user gets bounced to `/session-expired` even though they never logged in. More subtly, the `forgot-password` page does NOT clear `localStorage` on arrival, so an old expired token from the previous session could remain attached to background requests and trigger a loop.

Also, `.includes('/auth/login')` matches `/api/v1/auth/login/refresh` and any path containing that substring — not a bug today (no such path exists) but a fragile string match. Prefer exact URL suffix checks or an explicit flag on the axios config.

**Fix:**

```typescript
const AUTH_FREE_PATHS = ['/login', '/session-expired', '/forgot-password']
const AUTH_FREE_URLS = ['/auth/login', '/auth/password-reset']

const onAuthFreePath = AUTH_FREE_PATHS.some(p => window.location.pathname === p || window.location.pathname.startsWith(p + '/'))
const isAuthFreeUrl = AUTH_FREE_URLS.some(u => error.config?.url?.endsWith(u))

if (error.response?.status === 401 && typeof window !== 'undefined' && !onAuthFreePath && !isAuthFreeUrl) {
  // ... clear + redirect
}
```

### FL-06: `UpdateProjectUseCase` ignores `status` when value is provided via `model_copy` but later dropped by the repo's `new_val is not None` filter

**File:** `Backend/app/infrastructure/database/repositories/project_repo.py:127-129`

**Issue:** The new `updatable_fields` list correctly includes `"status"`, closing the gap from before. However, line 129 guards every field update with `if new_val != old_val and new_val is not None`. For `status`, this works because `ProjectStatus.ACTIVE != ProjectStatus.ARCHIVED` and both are non-None.

But for the `description` and `end_date` fields, a legitimate use case of "clear the description" (set it to None) is silently dropped — the client sends `{description: null}`, `exclude_unset=True` preserves it in the dump, `model_copy` applies None to the entity, but this repo-level `new_val is not None` filter refuses to write the clear.

Similarly, `end_date: null` to remove a deadline is rejected.

**Fix:** Distinguish "field not provided" from "field explicitly cleared." Two-phase approach:

```python
# In UpdateProjectUseCase.execute, pass the set of user-supplied keys to the repo:
update_data = dto.model_dump(exclude_unset=True)
updated_keys = set(update_data.keys())
updated_project = project.model_copy(update=update_data)
result = await self.project_repo.update(updated_project, current_user_id, updated_keys=updated_keys)
```

```python
# In SqlAlchemyProjectRepository.update, honor the explicit set:
async def update(self, project: Project, user_id: Optional[int] = None, updated_keys: Optional[set] = None) -> Project:
    ...
    for field in updatable_fields:
        if updated_keys is not None and field not in updated_keys:
            continue  # field wasn't in the PATCH body — skip
        new_val = getattr(project, field, None)
        old_val = getattr(model, field, None)
        if new_val != old_val:  # allow None → None, value → None, etc.
            ...
            setattr(model, field, new_val)
```

If back-compat with the current behavior is required for Phase 10, add a TODO with a pointer to this review.

### FL-07: `CreateProjectUseCase.execute` uses `datetime.utcnow()` (deprecated) for recurring task `created_at`

**File:** `Backend/app/application/use_cases/manage_projects.py:90`

**Issue:** `datetime.utcnow()` returns a naive datetime and is deprecated in Python 3.12 (see PEP 680). The recurring task creation path uses `datetime.utcnow()` which:

1. Produces a deprecation warning on Python 3.12+.
2. Writes a naive UTC timestamp that may diverge from how other parts of the codebase store timestamps (SQLAlchemy models often use `server_default=func.now()` for timezone-aware columns).
3. Inside a use case in the application layer — should not import `datetime` from stdlib for time queries anyway; consider injecting a `Clock` port.

**Fix:**

```python
from datetime import datetime, timezone
# ...
created_at=datetime.now(timezone.utc),
```

Or, preferably per Clean Architecture, inject a clock port:

```python
# app/application/ports/clock.py
from abc import ABC, abstractmethod
from datetime import datetime

class IClock(ABC):
    @abstractmethod
    def now(self) -> datetime: ...
```

This also makes the use case deterministic under test.

---

## Note Items

### NT-01: `AuthProvider` does not re-read `localStorage` on cross-tab login

**File:** `Frontend2/context/auth-context.tsx:28-42`

**Issue:** Token hydration runs once in `useEffect([])`. If the user logs in on another tab, this tab won't pick up the token until a hard refresh. Low priority for Phase 10 (single-tab flows dominate) but common UX ask later. Fix: add a `storage` event listener that updates state when `AUTH_TOKEN_KEY` changes.

### NT-02: `THEME_INIT_SCRIPT` inline `<script>` is safe from XSS but duplicates PRESETS

**File:** `Frontend2/app/layout.tsx:37-79`

**Issue:** The inline script content is a hardcoded string constant — no template interpolation of user data — so there is no XSS vector. `JSON.parse` inside `g(...)` is wrapped in try/catch; failure path returns default. The outer try/catch falls back to light/cozy defaults. Correctness is fine.

What deserves attention: the `PRESETS` table is duplicated here and in `lib/theme.ts`. The comment on line 36 flags this ("If this table drifts from lib/theme.ts, the flicker will return"), so the project is aware. Recommend a lint rule or unit test that compares `PRESETS` from `lib/theme.ts` to the inline script's JSON fragment on CI.

### NT-03: Toast `setTimeout` is not cleared on unmount

**File:** `Frontend2/components/toast/index.tsx:46-48`

**Issue:** `showToast` schedules a `setTimeout` to remove the toast after N ms. If the `ToastProvider` unmounts before the timer fires, the timer still runs but `setToasts` closes over a stale reference — React will log a warning. Minor; React handles this gracefully in practice. Consider tracking timer IDs and clearing them in a cleanup `useEffect`.

### NT-04: Error toast hardcodes `#dc2626` / `#ffffff` — acceptable, note WCAG compliance

**File:** `Frontend2/components/toast/index.tsx:28-38`

**Observation:** White text (`#ffffff`) on `#dc2626` (Tailwind red-600) has a contrast ratio of ~4.8:1, which meets WCAG AA for normal text (4.5:1) but fails AAA (7:1). Acceptable for short error messages. The comment on lines 23-25 correctly justifies the theme-independence choice. No change required. If a future design review demands AAA, switch to `#b91c1c` (red-700) or increase font weight.

### NT-05: `STATUS_LABEL_TR` only covers Turkish in `project-card.tsx` and `app-shell.tsx`

**File:** `Frontend2/components/projects/project-card.tsx:25-30`, `Frontend2/components/app-shell.tsx:27-32`

**Observation:** English falls back to the raw enum string (e.g. "ACTIVE" rendered verbatim). Same map is duplicated in two places. Consider extracting to a shared i18n helper. Not blocking.

### NT-06: `seed_data` uses `"123456"` as default password for seeded users

**File:** `Backend/app/infrastructure/database/seeder.py:179`

**Observation:** The seeder hashes `"123456"` for all seeded users including the admin account `admin@spms.com`. This is fine for dev/test but should be explicitly gated behind an environment flag (e.g. `SEED_DEV_PASSWORDS`) before running in any shared environment. Add a runtime guard or README note. Not a Phase 10 regression — pre-existing.

### NT-07: `get_global_activity` `count(*)` scan on every dashboard load

**File:** `Backend/app/infrastructure/database/repositories/audit_repo.py:195-196`

**Observation:** Every call to `/activity` runs `SELECT COUNT(*) FROM audit_log` and then the bounded `SELECT ... LIMIT N`. On a production audit_log with millions of rows this is expensive. Performance is out of scope for v1 per the review charter, but note: the count is used only to return `total` in the response, and the dashboard widget does not display a total counter today. Consider:

1. Drop `total` from the response shape (client does not use it).
2. Or compute `total` only when `offset == 0` via an estimated `EXPLAIN` planner stat.

### NT-08: Seeder `seed_projects` assumes 4 specific keys ("SPMS","MOB","DATA","AI") in `detail_dispatch`

**File:** `Backend/app/infrastructure/database/seeder.py:135-143`

**Observation:** The dispatch map ties detail seeders to project keys. If `PROJECTS_DATA` is expanded with a new entry (e.g. "WEB"), no detail seeder runs for it — silently skipped. Prefer keying dispatch on methodology:

```python
detail_dispatch = {
    Methodology.SCRUM: seed_scrum_details,
    Methodology.KANBAN: seed_kanban_details,
    Methodology.WATERFALL: seed_waterfall_details,
}
for project in created_projects:
    seeder = detail_dispatch.get(project.methodology)
    if seeder:
        await seeder(session, project, users_map)
```

Not a Phase 10 bug but adjacent to the seeder changes in this phase.

---

_Reviewed: 2026-04-21T23:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
